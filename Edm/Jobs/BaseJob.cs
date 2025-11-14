using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace Microprojects.Edm.Jobs
{
    public class BaseJob : IJob
    {
        public CancellationTokenSource CancellationTokenSource { get; } = new CancellationTokenSource();

        public CancellationToken CancellationToken
        {
            get => CancellationTokenSource.Token;
        }

        public virtual IJobParameters JobParameters { get; set; }

        public virtual string Name
        {
            get => GetType().GetCustomAttribute<JobAttribute>()?.Name ??
                   GetType().Name.Replace("Job", string.Empty);
        }

        public virtual string Description
        {
            get => GetType().GetCustomAttribute<JobAttribute>()?.Description;
        }

        public JobLifetime Lifetime
        {
            get => GetType().GetCustomAttribute<JobAttribute>()?.Lifetime ?? JobLifetime.ShortRunning;
        }

        private bool _disposed = false;

        public virtual Task<bool> InitAsync()
        {
            return Task.FromResult(true);
        }

        public virtual Task<object> ExecuteAsync()
        {
            return Task.FromResult((object)"Ok");
        }

        public virtual Dictionary<string, object> GetParameters()
        {
            var paramStr = JsonConvert.SerializeObject((object)JobParameters ?? this);
            return JsonConvert.DeserializeObject<Dictionary<string, object>>(paramStr);
        }

        public void SetParameters(string data)
        {
            data = data ?? "{}";
            var jobParamsType = GetType().GetCustomAttribute<JobAttribute>(true)?.Parameters;
            if (jobParamsType != null)
            {
                var param = Activator.CreateInstance(jobParamsType);
                JsonConvert.PopulateObject(data, param);
                JobParameters = param as IJobParameters;
            }
            else
            {
                JsonConvert.PopulateObject(data, this);
            }
        }

        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                CancellationTokenSource?.Dispose();
            }
        }

        public void Dispose()
        {
            if (_disposed)
                return;
            Dispose(true);
            _disposed = true;
            GC.SuppressFinalize(this);
        }

        ~BaseJob()
        {
            Dispose(false);
        }
    }

    public class JobParameters : IJobParameters
    {
        public string CacheConnectionString { get; set; }
        public int CacheDbNumber { get; set; }
    }

    [AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
    public class JobParameterAttribute : Attribute
    {
        public string Name { get; set; }
        public bool Required { get; set; } = false;
    }
}