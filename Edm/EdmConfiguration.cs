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

namespace Microprojects.Edm
{
    public class EdmConfiguration
    {
        internal Dictionary<string, Type> NamedJobs { get; } = new (); 

        public EdmConfiguration() { }

        /// <summary>
        /// Registers "On Demand" named job to launch on remote host.
        /// </summary>
        /// <param name="job"></param>
        /// <returns></returns>
        public EdmConfiguration Register<T>() where T : IJob
        {
            NamedJobs.Add(typeof(T).GetJobName(), typeof(T));
            return this;
        }
    }
}
