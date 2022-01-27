using Microprojects.Edm.Log;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Text;

namespace Microprojects.Edm.Jobs;

public class JobConfiguration
{
    internal Dictionary<string, Type> NamedJobs { get; } = new();

    public JobConfiguration() { }

    /// <summary>
    /// Registers "On Demand" named job to launch on remote host.
    /// </summary>
    /// <param name="job"></param>
    /// <returns></returns>
    public JobConfiguration Register<T>() where T : IJob
    {
        NamedJobs.Add(typeof(T).GetJobName(), typeof(T));
        return this;
    }

    public JobConfiguration Register(Type type)
    {
        if (typeof(IJob).IsAssignableFrom(type))
        {
            NamedJobs.Add(type.GetJobName(), type);
        }
        else
        {
            throw new EdmException($"Type {type.FullName} is not a job");
        }

        return this;
    }

    public JobConfiguration Register(IEnumerable<Type> types)
    {
        foreach (var type in types)
        {
            NamedJobs.Add(type.GetJobName(), type);
        }

        return this;
    }

    public IEnumerable<Type> GetRegisteredJobTypes() => NamedJobs.Select(j => j.Value);
}
