using Microprojects.Edm.Utils;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace Microprojects.Edm.Jobs;

public class JobContainer : IJobContainer
{
    private readonly JobConfiguration _config;
    private readonly IServiceProvider _services;
    private readonly ILogger<JobContainer> _logger;

    public ConcurrentDictionary<int, CancellableTask> RunningTasks { get; } = [];
    public Hive Hive { get; } = new Hive();

    public JobContainer()
    {
    }

    public JobContainer(IServiceProvider serviceProvider, IOptions<JobConfiguration> config,
        ILogger<JobContainer> logger)
    {
        _services = serviceProvider;
        _config = config.Value;
        _logger = logger;
    }

    public void Start()
    {
        RunEverTasks();
    }

    public void Stop()
    {
        Dispose();
    }

    private IEnumerable<Type> GetAllJobs()
    {
        return _config.NamedJobs.Select(p => p.Value);
    }

    public IEnumerable<AvailableTask> GetRunningTasks()
    {
        return RunningTasks.Values
            .Select(t => new AvailableTask()
            {
                Name = t.Job.Name,
                Description = t.Job.Description,
                Status = "Executing",
                Type = t.TokenSource.IsCancellationRequested ? "Cancelling" : t.Task.Status.ToString(),
                Pid = t.Task.Id.ToString()
            });
    }

    public IEnumerable<IJob> GetRunningJobs() => RunningTasks.Values
        .Select(t => t.Job);

    public IEnumerable<AvailableTask> GetAvailableTasks()
    {
        return GetAllJobs().Select(c => new AvailableTask()
        {
            Name = c.GetCustomAttribute<JobAttribute>()?.Name ?? c.GetType().Name.Replace("Job", string.Empty),
            Type = c.GetCustomAttribute<JobAttribute>()?.Lifetime.ToString() ?? JobLifetime.ShortRunning.ToString(),
            Description = c.GetCustomAttribute<JobAttribute>()?.Description
        }).ToList();
    }

    public Task<ResponseData> ExecuteAsync<T>(IJobParameters parameters) where T : IJob
    {
        return ExecuteAsync(typeof(T), parameters);
    }

    public async Task<ResponseData> ExecuteAsync(Type jobType, IJobParameters parameters = null)
    {
        var response = new ResponseData { Status = JobStatus.SUCCESS, Response = JobStatus.SUCCESS };
        // TODO Using async calls make no difference between lifetimes, refactor this to single call
        try
        {
            switch (jobType.GetJobLifetime())
            {
                case JobLifetime.ShortRunning:
                    using (var scope = _services.CreateScope())
                    {
                        var job = await GetScopedJob(scope, jobType, parameters);
                        var result = await job.ExecuteAsync();
                        response.Response = JsonConvert.SerializeObject(result);
                        response.Message = $"Job {job.Name} executed successfully";
                        //Logger.Log(response.Message);
                    }

                    break;
                case JobLifetime.Permanent:
                case JobLifetime.LongRunning:
                    response = await RunLongTask(jobType, parameters);
                    break;
            }
        }
        catch (Exception ex)
        {
            response.Status = JobStatus.FAILED;
            response.Message = ex.GetMeaningfulMessage();
        }

        return response;
    }

    public Task<IJob> GetJobAsync<T>(IServiceScope scope, IJobParameters parameters = null) where T : IJob =>
        GetScopedJob(scope, typeof(T), parameters);

    private async Task<IJob> GetScopedJob(IServiceScope scope, Type jobType, IJobParameters parameters = null)
    {
        var job = (IJob)scope.ServiceProvider.GetService(jobType) ??
                  throw new EdmException($"Job is not registered: {jobType.Name}");

        if (job is INeedServiceScope scopedJob)
        {
            scopedJob.ServiceScope = scope;
        }

        if (parameters != null)
        {
            if (!parameters.GetType().IsAssignableTo(jobType.GetJobParameters()))
            {
                throw new EdmException($"Job parameters must be instance of {jobType.GetJobParameters().Name}");
            }

            job.JobParameters = parameters;
        }
        else
        {
            job.SetParameters(null);
        }

        if (await job.InitAsync())
            return job;
        
        throw new EdmException($"Cannot initialize the job {job.Name}");
    }

    // public Task<ResponseData> ExecuteAsync(Action job)
    // {
    //     Task.Run(job).ConfigureAwait(false);
    //     return Task.FromResult(new ResponseData { Status = JobStatus.SUCCESS });
    // }

    public Task<ResponseData> ExecuteAsync(IJob job) => RunLongTask(job);
    
    public async Task<ResponseData> ExecuteAsync(JobData data)
    {
        try
        {
            //Logger.Log($"User {ServiceSecurityContext.Current.PrimaryIdentity.Name} calling...");
            //var sec = OperationContext.Current.ServiceSecurityContext;
            var response = new ResponseData { Status = JobStatus.SUCCESS, Response = JobStatus.SUCCESS };

            if (data.Job == "Stop")
            {
                var task = GetTaskByParams(data.Params);
                if (task != null)
                {
                    if (task.Task.Status == TaskStatus.Running ||
                        task.Task.Status == TaskStatus.WaitingForActivation ||
                        task.Task.Status == TaskStatus.WaitingToRun ||
                        task.Task.Status == TaskStatus.WaitingForChildrenToComplete)
                    {
                        response.Message = $"Task {task.Task.Id} {task.Job.Name} was requested to stop";
                        _logger.LogInformation("Task {Id} {JobName} was requested to stop", task.Task.Id,
                            task.Job.Name);
                        task.TokenSource.Cancel();
                    }
                    else
                    {
                        response.Message =
                            $"Task {task.Task.Id} {task.Job.Name} was requested to stop but is not running";
                        response.Status = JobStatus.FAILED;
                        _logger.LogError("Task {Id} {JobName} was requested to stop but is not running", task.Task.Id,
                            task.Job.Name);
                    }
                }
                else
                {
                    response.Message = $"Task not found. Parameters: {data.Params}";
                    response.Status = JobStatus.FAILED;
                }
            }
            else if (data.Job == "Check")
            {
                try
                {
                    var task = GetTaskByParams(data.Params);
                    response.Message = task.Task.Status.ToString();
                }
                catch (EdmException e)
                {
                    // Likely the task has been completed and disposed already
                    // TODO keep finished tasks in the container before first check?
                    response.Message = TaskStatus.RanToCompletion.ToString();
                    response.Response = e.Message;
                }
            }
            else
            {
                var jobType = GetAllJobs()
                                  .FirstOrDefault(c => c.GetCustomAttribute<JobAttribute>()?.Name == data.Job)
                              ?? throw new ArgumentException($"Job {data.Job} does not exist");
                var parameters = ConvertParameters(jobType, data.Params);
                response = await ExecuteAsync(jobType, parameters);
            }

            return response;
        }
        catch (Exception e)
        {
            //Logger.Error(e.GetFullInfo());
            return new ResponseData { Status = JobStatus.FAILED, Message = e.GetMeaningfulMessage() };
        }
    }

    public void Dispose()
    {
        Dispose(true);
        //GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (disposing)
        {
            RunningTasks.Values.AsParallel()
                .ForAll(async t =>
                {
                    try
                    {
                        t.TokenSource.Cancel();
                        await t.Task.ContinueWith(t => { });
                        _logger.LogInformation("Container stopping: task {Id} {Name} canceled", t.Task.Id, t.Job.Name);
                    }
                    catch (Exception e)
                    {
                        _logger.LogError(
                            "Container stopping: task {Id} {Name} failed to cancel with exception: {Exception}",
                            t.Task.Id,
                            t.Job.Name, e.GetFullInfo());
                    }
                });
            RunningTasks.Clear();
        }
    }

    private void RunEverTasks()
    {
        // Launch all "ever"-running jobs
        var everJobs = _config.NamedJobs
            .Select(p => p.Value)
            .Where(c => c.GetCustomAttribute<JobAttribute>()?.Lifetime == JobLifetime.Permanent);
        foreach (var jobType in everJobs)
        {
            ExecuteAsync(jobType);
        }
    }

    private async Task<ResponseData> RunLongTask(Type jobType, IJobParameters parameters = null)
    {
        var longTask = new CancellableTask();
        var semaphore = new TaskCompletionSource<ResponseData>();
        var task = Task.Run(async () =>
        {
            using var scope = _services.CreateScope();
            IJob job = null;
            try
            {
                job = await GetScopedJob(scope, jobType, parameters);
                longTask.Job = job;
                longTask.TokenSource = job.CancellationTokenSource;
                semaphore.SetResult(new  ResponseData
                {
                    Status = JobStatus.SUCCESS, 
                    Message = $"Job {jobType.GetJobName()} started"
                });
            }
            catch (Exception e)
            {
                semaphore.SetResult(new ResponseData
                {
                    Status = JobStatus.FAILED, 
                    Message = e.GetMeaningfulMessage()
                });
                return;
            }

            await job!.ExecuteAsync();
        });
        longTask.Task = task;
        RunningTasks[task.Id] = longTask;
        task.ContinueWith(t =>
        {
            switch (t.Status)
            {
                case TaskStatus.Canceled:
                    _logger.LogInformation("Job {Name} {Id} canceled by user", longTask.Job?.Name, t.Id);
                    break;
                case TaskStatus.Faulted:
                    _logger.LogError("Job {Name} {Id} failed with exception: {Exception}", longTask.Job?.Name, t.Id,
                        t.Exception?.Flatten().GetFullInfo());
                    break;
                case TaskStatus.RanToCompletion:
                    _logger.LogInformation("Job {Name} {Id} completed successfully", longTask.Job?.Name, t.Id);
                    break;
            }

            DisposeTask(t.Id);
        }, TaskScheduler.Default);
        var response = await semaphore.Task;
        response.Response = JsonConvert.SerializeObject(task.Id);

        return response;
    }

    private Task<ResponseData> RunLongTask(IJob job)
    {
        var longTask = new CancellableTask();
        var task = Task.Run(async () =>
        {
            longTask.Job = job;
            longTask.TokenSource = job.CancellationTokenSource;
            await job!.ExecuteAsync();
        }).ContinueWith(t =>
        {
            switch (t.Status)
            {
                case TaskStatus.Canceled:
                    _logger.LogInformation("Job {Name} {Id} canceled by user", longTask.Job?.Name, t.Id);
                    break;
                case TaskStatus.Faulted:
                    _logger.LogError("Job {Name} {Id} failed with exception: {Exception}", longTask.Job?.Name, t.Id,
                        t.Exception?.Flatten().GetFullInfo());
                    break;
                case TaskStatus.RanToCompletion:
                    _logger.LogInformation("Job {Name} {Id} completed successfully", longTask.Job?.Name, t.Id);
                    break;
            }

            DisposeTask(t.Id);
        }, TaskScheduler.Default);
        longTask.Task = task;
        RunningTasks[task.Id] = longTask;
        var response = new ResponseData
        {
            Status = JobStatus.SUCCESS, 
            Message = $"Job {job.Name} started",
            Response = JsonConvert.SerializeObject(task.Id)
        };

        return Task.FromResult(response);
    }

    private CancellableTask GetTaskByPid(int pid)
    {
        return RunningTasks.GetValueOrDefault(pid);
    }

    private CancellableTask GetTaskByParams(string param)
    {
        int pid;
        var parameters = JsonConvert.DeserializeObject<Dictionary<string, object>>(param);
        if (parameters.ContainsKey("Pid"))
        {
            if (!int.TryParse(parameters["Pid"] as string, out pid))
            {
                throw new Exception("'Pid' parameter must be integer");
            }
        }
        else
        {
            if (!parameters.TryGetValue("Job", out var jobName))
            {
                throw new Exception($"Stop job: parameter \"Job\" is mandatory");
            }

            var job = RunningTasks.Values
                          .FirstOrDefault(t =>
                              jobName.ToString() == t.Job?.Name &&
                              parameters.All(p =>
                                  p.Key == "Job" ||
                                  t.Job.GetParameters().ContainsKey(p.Key) &&
                                  parameters[p.Key] == p.Value))
                      ?? throw new EdmException(
                          $"Job, executing with parameters {JsonConvert.SerializeObject(parameters)} cannot be found");
            pid = job.Task.Id;
        }

        var task = GetTaskByPid(pid);
        return task;
    }

    private void DisposeTask(int pid)
    {
        RunningTasks.TryRemove(pid, out var _);
    }

    private static IJobParameters ConvertParameters(Type jobType, string data)
    {
        var jobParamsType = jobType.GetCustomAttribute<JobAttribute>(true)?.Parameters
                            ?? throw new EdmException($"Parameters type for {jobType.Name} is not defined");
        var param = (IJobParameters)Activator.CreateInstance(jobParamsType);
        JsonConvert.PopulateObject(data ?? "{}", param);
        return param;
    }
}