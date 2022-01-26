using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Log;
using Microprojects.Edm.Utils;
using Newtonsoft.Json;
using Testcalibur.Utils;

namespace Microprojects.Edm.Jobs
{
    public class BaseJob : IJob
    {
        protected CancellationToken CancellationToken { get; set; } = CancellationToken.None;
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

        public virtual bool Init()
        {
            return true;
        }

        public virtual Task<object> ExecuteAsync()
        {
            return Task.FromResult((object) "Ok");
        }

        public virtual Task<object> ExecuteAsync(CancellationToken cancellationToken)
        {
            CancellationToken = cancellationToken;
            return ExecuteAsync();
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
