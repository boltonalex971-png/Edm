using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Microprojects.Edm
{
    public interface ICommandContainer : IDisposable
    {
        ICollection<EdmHost> Hive { get; }
        ICollection<CancellableTask> RunningTasks { get; }
        IEnumerable<AvailableTask> GetRunningTasks();
        IEnumerable<AvailableTask> GetAvailableTasks();
        Task<ResponseData> ExecuteAsync<T>(ICommandParameters parameters = null) where T : ICommand;
        Task<ResponseData> ExecuteAsync(Type commandType, ICommandParameters parameters = null);
        Task<ResponseData> ExecuteAsync(CommandData data);
        void Start();
        void Stop();
    }

    public class CommandData
    {
        public string Command { get; set; }
        public string Params { get; set; }
    }

    public class ResponseData
    {
        public ResponseData() { }
        public string Status { get; set; }
        public string Message { get; set; }
        public string Response { get; set; }
    }

    public class AvailableTask
    {
        public string TaskName { get; set; }
        public string Status { get; set; }
        public string Type { get; set; }
        public string Pid { get; set; }
    }

    public class CancellableTask
    {
        public Task Task { get; set; }
        public ICommand Command { get; set; }
        public CancellationTokenSource TokenSource { get; set; }
    }
}
