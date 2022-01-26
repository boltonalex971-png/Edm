using Microprojects.Edm.Jobs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Microprojects.Edm
{
    public interface IJob
    {
        string Name { get; }
        string Description { get; }
        JobLifetime Lifetime { get; }
        IJobParameters JobParameters { get; set; }
        Task<object> ExecuteAsync();
        Task<object> ExecuteAsync(CancellationToken cancellationToken);
        Dictionary<string, object> GetParameters();
        void SetParameters(string data);
        bool Init();
    }

    public interface IJobParameters
    {
    }

    public enum JobLifetime
    {
        Permanent,
        LongRunning,
        ShortRunning
    }

    [AttributeUsage(AttributeTargets.Class)]
    public class JobAttribute : Attribute
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public JobLifetime Lifetime { get; set; }
        public Type Parameters { get; set; }
    }

    public static class JobHelper
    {
        public static string GetJobName(this Type jobType) => jobType
            .GetCustomAttribute<JobAttribute>()?.Name ?? 
                jobType.GetType().Name.Replace("Job", string.Empty);

        public static Type GetJobParameters(this Type jobType) => jobType
            .GetCustomAttribute<JobAttribute>()?.Parameters ??
                typeof(JobParameters);

        public static JobLifetime GetJobLifetime(this Type jobType) => jobType
            .GetCustomAttribute<JobAttribute>()?.Lifetime ??
                JobLifetime.ShortRunning;
    }


}
