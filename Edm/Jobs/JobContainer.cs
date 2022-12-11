using Microprojects.Edm.Utils;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace Microprojects.Edm.Jobs;

public class JobContainer : IJobContainer
{
    public static readonly string FAILED_STATUS = "Failed";
    public static readonly string NOT_FOUND = "Not found";
    public static readonly string SUCCESS_STATUS = "Ok";

    private readonly JobConfiguration _config;
    private readonly IServiceProvider _services;
    private readonly ILogger<JobContainer> _logger;

    public ICollection<CancellableTask> RunningTasks { get; } = new List<CancellableTask>();
    public Hive Hive { get; } = new Hive();

    public JobContainer()
    {
    }

    public JobContainer(IServiceProvider serviceProvider, IOptions<JobConfiguration> config, ILogger<JobContainer> logger)
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
        return RunningTasks.Select(t => new AvailableTask()
        {
            Name = t.Job.Name,
            Description = t.Job.Description,
            Status = "Executing",
            Type = t.TokenSource.IsCancellationRequested ? "Cancelling" : t.Task.Status.ToString(),
            Pid = t.Task.Id.ToString()
        });

    }

    public IEnumerable<IJob> GetRunningJobs() => RunningTasks.Select(t => t.Job);

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
        var response = new ResponseData { Status = SUCCESS_STATUS, Response = SUCCESS_STATUS };
        // TODO Using async calls make no difference between lifetimes, refactor this to single call
        switch (jobType.GetJobLifetime())
        {
            case JobLifetime.ShortRunning:
                using (var scope = _services.CreateScope())
                {
                    var job = GetScopedJob(scope, jobType, parameters);
                    var result = await job.ExecuteAsync();
                    response.Response = JsonConvert.SerializeObject(result);
                    response.Message = $"Job {job.Name} executed succesfully";
                    //Logger.Log(response.Message);
                }
                break;
            case JobLifetime.Permanent:
            case JobLifetime.LongRunning:
                var taskId = RunLongTask(jobType, parameters);
                response.Response = JsonConvert.SerializeObject(taskId);
                response.Message = $"Job {jobType.GetJobName} {taskId} started";
                break;
        }

        return response;
    }

    private IJob GetScopedJob(IServiceScope scope, Type jobType, IJobParameters parameters = null)
    {
        var job = (IJob)scope.ServiceProvider.GetService(jobType) ??
            throw new EdmException($"Job is not a registered service: {jobType.Name}");

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

        job.Init();

        return job;
    }

    public Task<ResponseData> ExecuteAsync(Action job)
    {
        Task.Run(job).ConfigureAwait(false);
        return Task.FromResult(new ResponseData { Status = SUCCESS_STATUS });
    }

    public Task<ResponseData> ExecuteAsync(IJob job)
    {

        job.Init();
        var response = new ResponseData { Status = SUCCESS_STATUS, Response = SUCCESS_STATUS };
        // TODO Using async calls make no difference between lifetimes, refactor this to single call
        //switch (job.Lifetime)
        //{
        //    case JobLifetime.ShortRunning:
        //        var result = await job.ExecuteAsync();
        //        response.Response = JsonConvert.SerializeObject(result);
        //        response.Message = $"Job {job.Name} executed succesfully";
        //        //Logger.Log(response.Message);
        //        break;
        //    case JobLifetime.Permanent:
        //    case JobLifetime.LongRunning:
        //        var taskId = RunLongTask(job);
        //        response.Response = JsonConvert.SerializeObject(taskId);
        //        response.Message = $"Task {taskId} {job.Name} started succesfully";
        //        break;
        //}

        return Task.FromResult(response);
    }

    public async Task<ResponseData> ExecuteAsync(JobData data)
    {
        try
        {
            //Logger.Log($"User {ServiceSecurityContext.Current.PrimaryIdentity.Name} calling...");
            //var sec = OperationContext.Current.ServiceSecurityContext;
            var response = new ResponseData { Status = SUCCESS_STATUS, Response = SUCCESS_STATUS };

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
                        _logger.LogInformation("Task {Id} {JobName} was requested to stop", task.Task.Id, task.Job.Name);
                        task.TokenSource.Cancel();
                    }
                    else
                    {
                        response.Message = $"Task {task.Task.Id} {task.Job.Name} was requested to stop but is not running";
                        response.Status = FAILED_STATUS;
                        _logger.LogError("Task {Id} {JobName} was requested to stop but is not running", task.Task.Id, task.Job.Name);
                    }
                }
                else
                {
                    response.Message = $"Task not found. Parameters: {data.Params}";
                    response.Status = FAILED_STATUS;
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
            return new ResponseData { Status = FAILED_STATUS, Message = e.GetMeaningfulMessage() };
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
            RunningTasks.AsParallel().ForAll(async t =>
            {
                try
                {
                    t.TokenSource.Cancel();
                    await t.Task.ContinueWith(t => { });
                    _logger.LogInformation("Container stopping: task {Id} {Name} canceled", t.Task.Id, t.Job.Name);
                }
                catch (Exception e)
                {
                    _logger.LogError("Container stopping: task {Id} {Name} failed to cancel with exception: {Exception}", t.Task.Id, t.Job.Name, e.GetFullInfo());
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

    private int RunLongTask(Type jobType, IJobParameters parameters = null)
    {
        var tokenSource = new CancellationTokenSource();
        var token = tokenSource.Token;
        //var task = job.ExecuteAsync(token);
        var longTask = new CancellableTask { TokenSource = tokenSource };
        RunningTasks.Add(longTask);
        var task = Task.Run(async () =>
        {
            using var scope = _services.CreateScope();
            var job = GetScopedJob(scope, jobType, parameters);
            longTask.Job = job;
            await job.ExecuteAsync(token);
        });
        longTask.Task = task;

        task.ContinueWith(t =>
        {
            switch (t.Status)
            {
                case TaskStatus.Canceled:
                    _logger.LogInformation("Job {Name} {Id} canceled by user", longTask.Job.Name, t.Id);
                    break;
                case TaskStatus.Faulted:
                    _logger.LogError("Job {Name} {Id} failed with exception: {Exception}", longTask.Job.Name, t.Id, t.Exception.Flatten().GetFullInfo());
                    break;
                case TaskStatus.RanToCompletion:
                    _logger.LogInformation("Job {Name} {Id} completed successfully", longTask.Job.Name, t.Id);
                    break;
            }

            DisposeTask(t.Id);
        }, TaskScheduler.Default);

        return task.Id;
    }

    private CancellableTask GetTaskByPid(int pid)
    {
        return RunningTasks.FirstOrDefault(t => t.Task.Id == pid);
        //?? throw new Exception($"Running task with PID {pid} not found");
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

            var job = RunningTasks
                .FirstOrDefault(t =>
                    jobName.ToString() == t.Job?.Name &&
                    parameters.All(p =>
                        p.Key == "Job" ||
                        t.Job.GetParameters().ContainsKey(p.Key) &&
                        parameters[p.Key] == p.Value))
                ?? throw new EdmException($"Job, executing with parameters {JsonConvert.SerializeObject(parameters)} cannot be found");
            pid = job.Task.Id;
        }
        var task = GetTaskByPid(pid);
        return task;
    }

    private void DisposeTask(int pid)
    {
        var task = GetTaskByPid(pid);
        if (task != null)
        {
            RunningTasks.Remove(task);
        }
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
