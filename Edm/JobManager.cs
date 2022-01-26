using System;
using System.Collections.Generic;
using System.Composition;
using System.Composition.Hosting;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization;
using System.Security.Permissions;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Log;
using Microprojects.Edm.Utils;
using Microprojects.Edm.Utils.Notifications;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace Microprojects.Edm
{
    public class JobManager : IJobContainer
    {
        public static readonly string FAILED_STATUS = "Failed";
        public static readonly string NOT_FOUND = "Not found";
        public static readonly string SUCCESS_STATUS = "Ok";

        private static IJobContainer _jobContainerInstance;

        private EdmConfiguration _config;
        private IServiceProvider _services;
        
        public ICollection<CancellableTask> RunningTasks { get; } = new List<CancellableTask>();
        public JobHive Hive { get; } = new JobHive();

        public JobManager()
        {
        }

        public JobManager(IServiceProvider serviceProvider, IOptions<EdmConfiguration> config)
        {
            _services = serviceProvider;
            _config = config.Value;
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
                Type = t.TokenSource.IsCancellationRequested ? "Canceling" : t.Task.Status.ToString(),
                Pid = t.Task.Id.ToString()
            });

        }

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
            if (GetAllJobs().FirstOrDefault(c => c == jobType) == null)
            {
                throw new EdmException($"No job found: {jobType.Name}");
            }

            var job = (IJob)_services?.GetService(jobType) ??
                throw new EdmException($"Job found but not registered as a service: {jobType.Name}");
            if (parameters != null && parameters.GetType().IsInstanceOfType(jobType.GetJobParameters()))
            {
                throw new EdmException($"Job parameters must be instance of {jobType.GetJobParameters().Name}");
            }

            job.JobParameters = parameters;
            var response = await ExecuteAsync(job);
            return response;
        }

        public Task<ResponseData> ExecuteAsync(Action job)
        {
            Task.Run(job).ConfigureAwait(false);
            return Task.FromResult(new ResponseData { Status = SUCCESS_STATUS });
        }

        public async Task<ResponseData> ExecuteAsync(IJob job)
        {

            job.Init();
            var response = new ResponseData { Status = SUCCESS_STATUS, Response = SUCCESS_STATUS };
            // TODO Using async calls make no difference between lifetimes, refactor this to single call
            switch (job.Lifetime)
            {
                case JobLifetime.ShortRunning:
                    var result = await job.ExecuteAsync();
                    response.Response = JsonConvert.SerializeObject(result);
                    response.Message = $"Job {job.Name} executed succesfully";
                    //Logger.Log(response.Message);
                    break;
                case JobLifetime.Permanent:
                case JobLifetime.LongRunning:
                    var taskId = RunLongTask(job);
                    response.Response = JsonConvert.SerializeObject(taskId);
                    response.Message = $"Task {taskId} {job.Name} started succesfully";
                    break;
            }

            return response;
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
                            Logger.Log(response.Message);
                            task.TokenSource.Cancel();
                        }
                        else
                        {
                            response.Message = $"Task {task.Task.Id} {task.Job.Name} was requested to stop but is not running";
                            response.Status = FAILED_STATUS;
                            Logger.Error(response.Message);
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
            var ok = RunningTasks.All(t =>
            {
                try
                {
                    t.TokenSource.Cancel();
                    Logger.Log($"Container stopping: task {t.Task.Id} {t.Job.Name} cancelled");
                    return true;
                }
                catch (Exception e)
                {
                    Logger.Error($"Container stopping: task {t.Task.Id} {t.Job.Name} failed to cancell with exception: {e.GetFullInfo()}");
                    return false;
                }
            });
        }

        private void RunEverTasks()
        {
            // Launch all "ever"-running jobs
            var everJobs = _config.NamedJobs
                .Select(p => p.Value)
                .Where(c => c.GetCustomAttribute<JobAttribute>()?.Lifetime == JobLifetime.Permanent);
            foreach (var job in everJobs)
            {
                var jobInstance = (IJob)_services.GetService(job);
                jobInstance.SetParameters(null);
                jobInstance.Init();
                var taskId = RunLongTask(jobInstance);
            }
        }

        private int RunLongTask(IJob job)
        {
            var tokenSource = new CancellationTokenSource();
            var token = tokenSource.Token;
            var task = job.ExecuteAsync(token);
            task.ContinueWith(t =>
                {
                    switch (t.Status)
                    {
                        case TaskStatus.Canceled:
                            Logger.Log($"Task {t.Id} {job.Name} was canceled by user");
                            break;
                        case TaskStatus.Faulted:
                            Logger.Error($"Task {t.Id} {job.Name} was canceled with exception: {t.Exception.Flatten().GetFullInfo()}");
                            break;
                        case TaskStatus.RanToCompletion:
                            Logger.Log($"Task {t.Id} {job.Name} completed successfully");
                            break;
                    }

                    DisposeTask(t.Id);
                }, TaskScheduler.Default);
            RunningTasks.Add(new CancellableTask { Task = task, Job = job, TokenSource = tokenSource });
            Logger.Log($"Task {task.Id} {job.Name} started succesfully");
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
                        jobName.ToString() == t.Job.Name &&
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

        private IJobParameters ConvertParameters(Type jobType, string data)
        {
            data = data ?? "{}";
            var jobParamsType = jobType.GetCustomAttribute<JobAttribute>(true)?.Parameters
                ?? throw new EdmException($"Parameters type for {jobType.Name} is not defined");
            var param = (IJobParameters) Activator.CreateInstance(jobParamsType);
            JsonConvert.PopulateObject(data, param);
            return param;
        }


    }

}
