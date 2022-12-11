using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Microprojects.Edm.Jobs;

public interface IJobContainer : IDisposable
{
    Hive Hive { get; }
    ICollection<CancellableTask> RunningTasks { get; }
    IEnumerable<AvailableTask> GetRunningTasks();
    IEnumerable<AvailableTask> GetAvailableTasks();
    IEnumerable<IJob> GetRunningJobs();
    Task<ResponseData> ExecuteAsync<T>(IJobParameters parameters = null) where T : IJob;
    Task<ResponseData> ExecuteAsync(Type jobType, IJobParameters parameters = null);
    Task<ResponseData> ExecuteAsync(JobData data);
    Task<ResponseData> ExecuteAsync(IJob job);
    Task<ResponseData> ExecuteAsync(Action job);
    void Start();
    void Stop();
}

public class JobData
{
    public string Job { get; set; }
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
    public string Name { get; set; }
    public string Description { get; set; }
    public string Status { get; set; }
    public string Type { get; set; }
    public string Pid { get; set; }
}

public class CancellableTask
{
    public Task Task { get; set; }
    public IJob Job { get; set; }
    public CancellationTokenSource TokenSource { get; set; }
}
