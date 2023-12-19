using Microprojects.Edm.Cache.Redis;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Intercom;
using Microprojects.Edm.Jobs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Linq;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Optosense.Edm.WebApi.Utils;

namespace Optosense.Edm.Core.AspNet
{
    public static class EdmHelper
    {
        public static void AddJobs(this IHostApplicationBuilder builder)
        {
            var jobTypes = AppDomain.CurrentDomain
                .GetAssemblies()
                .SelectMany(a => a.GetTypes().Where(t => typeof(IJob).IsAssignableFrom(t)));
            foreach (var jobType in jobTypes)
            {
                if (!jobType.IsNamedJob())
                    continue;

                builder.Services.Configure<JobConfiguration>(c => c.Register(jobType));
                builder.Services.AddScoped(jobType);
            }

            builder.Services.AddSingleton<IJobContainer, JobContainer>();
        }

        public static void AddCache(this IHostApplicationBuilder builder)
        {
            var options = builder.Configuration.GetSection("Edm:Cache").Get<CacheOptions>();
            ICache cache = options?.Default.Kind switch
            {
                CacheOptions.CacheKinds.Redis => new RedisCache(options.Default.ConnectionString),
                _ => new MemCache()
            };
            builder.Services.AddSingleton(cache);
        }

        public static void AddOperationIntercom(this IHostApplicationBuilder builder)
        {
            var options = builder.Configuration.GetSection("Edm:Intercom").Get<IntercomOptions>();
            IIntercom intercome = options?.Kind switch
            {
                IntercomOptions.Kinds.SignalR => new EdmIntercom(options),
                IntercomOptions.Kinds.Redis => new RedisCache(options.ConnectionString),
                _ => default
            };
            builder.Services.AddSingleton(intercome);
        }
    }

    public class CacheOptions
    {
        public enum CacheKinds 
        { 
            Redis,
            Mem
        }
        public CacheInstance Default { get; set; }
        public CacheInstance Spare { get; set; }
    }

    public class CacheInstance
    {
        public CacheOptions.CacheKinds Kind { get; set; }
        public string ConnectionString { get; set; }
    }
}