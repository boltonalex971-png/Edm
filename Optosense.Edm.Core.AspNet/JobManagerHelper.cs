using Microprojects.Edm.Jobs;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;

namespace Optosense.Edm.Core.AspNet;

public static class JobContainerHelper
{
    public static void AddJobs(this IServiceCollection services)
    {
        var jobTypes = AppDomain.CurrentDomain
            .GetAssemblies()
            .SelectMany(a => a.GetTypes().Where(t => typeof(IJob).IsAssignableFrom(t)));
        foreach (var jobType in jobTypes)
        {
            if (!jobType.IsNamedJob()) 
                continue;

            services.Configure<JobConfiguration>(c => c.Register(jobType));
            services.AddTransient(jobType);
        }

        services.AddSingleton<IJobContainer, JobContainer>();
    }
}
