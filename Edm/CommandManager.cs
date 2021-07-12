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
using Newtonsoft.Json;

namespace Microprojects.Edm
{
    public class CommandManager : ICommandContainer
    {
        public static readonly string FAILED_STATUS = "Failed";
        public static readonly string NOT_FOUND = "Not found";
        public static readonly string SUCCESS_STATUS = "Ok";

        private static ICommandContainer _commandContainerInstance;
        private IServiceProvider _services;
        public static ICommandContainer GetInstance()
        {
            if (EdmConfig.Plugins == null)
            {
                throw new NullReferenceException("Edm is not yet configured");
            }

            _commandContainerInstance = _commandContainerInstance ?? new CommandManager();
            return _commandContainerInstance;
        }

        //public IEnumerable<Lazy<ICommand, ICommandMetadata>> Commands;

        //private readonly CompositionContainer _compositionContainer;

        public IList<CancellableTask> RunningTasks { get; } = new List<CancellableTask>();

        public CommandManager()
        {
            RunEverTasks();
        }

        public CommandManager(IServiceProvider serviceProvider)
        {
            _services = serviceProvider;
            RunEverTasks();
        }

        private void RunEverTasks()
        {
            // Launch all "ever"-running commands
            var everCommands = EdmConfig.Plugins
                .SelectMany(p => p.Value)
                .Where(c => c.GetCustomAttribute<CommandAttribute>()?.Lifetime == CommandType.Permanent);
            foreach (var command in everCommands)
            {
                var commandInstance = (ICommand)_services.GetService(command); //(ICommand) Activator.CreateInstance(command.GetType());
                commandInstance.SetParameters(null);
                commandInstance.Init();
                var taskId = RunLongTask(commandInstance);
            }
        }

        private IEnumerable<Type> GetAllCommands()
        {
            return EdmConfig.Plugins.SelectMany(p => p.Value);
        }

        public IEnumerable<AvailableTask> GetRunningTasks()
        {
            return RunningTasks.Select(t => new AvailableTask()
            {
                TaskName = t.Command.Name,
                Status = "Executing",
                Type = t.TokenSource.IsCancellationRequested ? "Canceling" : t.Task.Status.ToString(),
                Pid = t.Task.Id.ToString()
            });

        }

        public IEnumerable<AvailableTask> GetAvailableTasks()
        {
            return GetAllCommands().Select(c => new AvailableTask()
            {
                TaskName = c.GetType().GetCustomAttribute<CommandAttribute>()?.Name ?? c.GetType().Name.Replace("Command", string.Empty),
                Type = c.GetType().GetCustomAttribute<CommandAttribute>()?.Lifetime.ToString() ?? CommandType.ShortRunning.ToString()
            }).ToList();
        }

        //public async Task<ResponseData> Request()
        //{
        //    var sec = OperationContext.Current.ServiceSecurityContext;
        //    var types = sec.AuthorizationContext.ClaimSets.Select(cs => cs.Select(c => c.ClaimType));
        //    WindowsIdentity winCaller = ServiceSecurityContext.Current.WindowsIdentity;
        //    Logger.Log($"User {winCaller.Name} called GetPorts command");
        //    //foreach (var group in winCaller.Groups)
        //    //{
        //    //Console.WriteLine(group.Translate(typeof(NTAccount)).Value);
        //    //}
        //    return await Execute(new CommandData { Command = "GetPorts" });
        //}

        public Task<ResponseData> ExecuteAsync<T>(ICommandParameters parameters) where T : ICommand
        {
            return ExecuteAsync(typeof(T), parameters);
        }

        public async Task<ResponseData> ExecuteAsync(Type commandType, ICommandParameters parameters = null)
        {
            if (GetAllCommands().FirstOrDefault(c => c == commandType) == null)
            {
                throw new EdmException($"No command found: {commandType.Name}");
            }

            var command = (ICommand)_services.GetService(commandType)
                ?? throw new EdmException($"Command found but not registered as a service: {commandType.Name}");
            var lifetime = commandType.GetCustomAttribute<CommandAttribute>()?.Lifetime;
            var paramType = commandType.GetCustomAttribute<CommandAttribute>()?.Parameters;
            if (parameters != null && parameters.GetType().IsInstanceOfType(paramType))
            {
                throw new EdmException($"Command parameters must be instance of {nameof(paramType)}");
            }

            command.CommandParameters = parameters;
            command.Init();
            var response = new ResponseData { Status = SUCCESS_STATUS, Response = SUCCESS_STATUS };
            // TODO Using async calls make no difference between lifetimes, refactor this to single call
            switch (lifetime)
            {
                case CommandType.ShortRunning:
                    var result = await command.ExecuteAsync();
                    response.Response = JsonConvert.SerializeObject(result);
                    response.Message = $"Command {command.Name} executed succesfully";
                    //Logger.Log(response.Message);
                    break;
                case CommandType.Permanent:
                case CommandType.LongRunning:
                    //command = command.GetNewInstance(); // statefull object needed
                    var taskId = RunLongTask(command);
                    response.Response = JsonConvert.SerializeObject(taskId);
                    response.Message = $"Task {taskId} {command.Name} started succesfully";
                    break;
            }

            return response;
        }

        public async Task<ResponseData> ExecuteAsync(CommandData data)
        {
            try
            {
                //Logger.Log($"User {ServiceSecurityContext.Current.PrimaryIdentity.Name} calling...");
                //var sec = OperationContext.Current.ServiceSecurityContext;
                var response = new ResponseData { Status = SUCCESS_STATUS, Response = SUCCESS_STATUS };

                if (data.Command == "Stop")
                {
                    var task = GetTaskByParams(data.Params);
                    if (task != null)
                    {
                        if (task.Task.Status == TaskStatus.Running ||
                            task.Task.Status == TaskStatus.WaitingForActivation ||
                            task.Task.Status == TaskStatus.WaitingToRun ||
                            task.Task.Status == TaskStatus.WaitingForChildrenToComplete)
                        {
                            response.Message = $"Task {task.Task.Id} {task.Command.Name} was requested to stop";
                            Logger.Log(response.Message);
                            task.TokenSource.Cancel();
                        }
                        else
                        {
                            response.Message = $"Task {task.Task.Id} {task.Command.Name} was requested to stop but is not running";
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
                else if (data.Command == "Check")
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
                    var commandType = GetAllCommands()
                        .FirstOrDefault(c => c.GetCustomAttribute<CommandAttribute>()?.Name == data.Command)
                            ?? throw new ArgumentException($"Command {data.Command} does not exist");
                    var parameters = ConvertParameters(commandType, data.Params);
                    response = await ExecuteAsync(commandType, parameters);
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
                    Logger.Log($"Container stopping: task {t.Task.Id} {t.Command.Name} cancelled");
                    return true;
                }
                catch (Exception e)
                {
                    Logger.Error($"Container stopping: task {t.Task.Id} {t.Command.Name} failed to cancell with exception: {e.GetFullInfo()}");
                    return false;
                }
            });
        }

        private int RunLongTask(ICommand command)
        {
            var tokenSource = new CancellationTokenSource();
            var token = tokenSource.Token;
            var task = command.ExecuteAsync(token);
            task.ContinueWith(t =>
                {
                    switch (t.Status)
                    {
                        case TaskStatus.Canceled:
                            Logger.Log($"Task {t.Id} {command.Name} was canceled by user");
                            break;
                        case TaskStatus.Faulted:
                            Logger.Error($"Task {t.Id} {command.Name} was canceled with exception: {t.Exception.Flatten().GetFullInfo()}");
                            break;
                        case TaskStatus.RanToCompletion:
                            Logger.Log($"Task {t.Id} {command.Name} completed successfully");
                            break;
                    }

                    DisposeTask(t.Id);
                }, TaskScheduler.Default);
            RunningTasks.Add(new CancellableTask { Task = task, Command = command, TokenSource = tokenSource });
            Logger.Log($"Task {task.Id} {command.Name} started succesfully");
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
                var commandName = parameters.ContainsKey("Command") ? parameters["Command"].ToString() :
                    throw new Exception($"Stop command: parameter \"Command\" is mandatory");
                var command = RunningTasks
                    .FirstOrDefault(t =>
                        commandName == t.Command.Name &&
                        parameters.All(p =>
                            p.Key == "Command" ||
                            t.Command.GetParameters().ContainsKey(p.Key) &&
                            parameters[p.Key] == p.Value))
                    ?? throw new EdmException($"Running command with parameters {JsonConvert.SerializeObject(parameters)} cannot be found");
                pid = command.Task.Id;
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

        private ICommandParameters ConvertParameters(Type commandType, string data)
        {
            data = data ?? "{}";
            var commandParamsType = commandType.GetCustomAttribute<CommandAttribute>(true)?.Parameters
                ?? throw new EdmException($"Parameters type for {commandType.Name} is not defined");
            var param = (ICommandParameters) Activator.CreateInstance(commandParamsType);
            JsonConvert.PopulateObject(data, param);
            return param;
        }


    }

}
