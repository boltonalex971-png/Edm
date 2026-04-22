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
using Newtonsoft.Json;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Builder;
using Optosense.Edm.Persistence;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Hosting.Server;
using Microprojects.Edm;
using System.Net;

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
            ICache cache = builder.Configuration.GetSection("Edm:Cache:Default:Kind").Value switch
            {
                "Redis" => new RedisCache(builder.Configuration.GetSection("Edm:Cache:Default:ConnectionString").Value),
                _ => new MemCache()
            };
            builder.Services.AddSingleton(cache);
        }

        public static void AddOperationIntercom(this IHostApplicationBuilder builder)
        {
            var options = builder.Configuration.GetSection("Edm:Intercom").Get<IntercomOptions>();
            builder.Services.AddSingleton<IIntercom>(provider => options?.Kind switch
            {
                IntercomOptions.Kinds.SignalR => new EdmIntercom(options, provider.GetService<ILogger<EdmIntercom>>()),
                IntercomOptions.Kinds.Redis => new RedisCache(options.ConnectionString),
                _ => default
            });
        }

        public static void UsePeer(this WebApplication app) {
            app.Use( (context, next) =>
            {
                using var scope = app.Services.CreateScope();
                var peerOptions = scope.ServiceProvider.GetRequiredService<IOptions<Peer>>();   
                var server = scope.ServiceProvider.GetRequiredService<IServer>();
                // This will include *all* configured addresses, whether they are from appsettings.json, launchSettings.json, ASPNETCORE_URLS environment variable, --urls command line arg, or the UseUrls extension method
                var addresses = server.Features.Get<IServerAddressesFeature>();
                var addr = context.Features.Get<IServerAddressesFeature>();
                var name = Dns.GetHostName();
                    return next();
            });
        }

        public static void UseJobs(this WebApplication app) => app.Services.GetRequiredService<IJobContainer>().Start();
    }

    public enum CacheKinds
    {
        Redis,
        Mem
    }

    public class CacheOptions
    {
        public CacheInstance Default { get; set; }
        public CacheInstance Spare { get; set; }
    }

    public class CacheInstance
    {
        public CacheKinds Kind { get; set; }
        public string ConnectionString { get; set; }
    }
}