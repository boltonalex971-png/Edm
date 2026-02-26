using Microprojects.Edm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;

namespace Optosense.Edm.Core.AspNet
{
    /// <summary>
    /// Specialized load context for EDM plugins with shared framework awareness.
    /// Ensures core EDM assemblies are shared across all plugins while isolating plugin-specific code.
    /// </summary>
    public class OptosenseLoadContext : EdmLoadContext
    {
        private static readonly HashSet<string> SharedAssemblies = new()
        {
            // Core framework assemblies that should be shared
            "System.Runtime",
            "System.Private.CoreLib",
            "System.Collections",
            "System.Linq",
            "System.Threading",
            "System.Net.Http",
            "Microsoft.AspNetCore.App",
            "Microsoft.NETCore.App",
            "Microsoft.Extensions",

            // EDM core assemblies shared across all plugins
            "Optosense.Edm.Domain",
            "Optosense.Edm.Core",
            "Microprojects.Edm",
            "Optosense.Edm.Plugins"
        };

        /// <summary>
        /// Creates a new load context for an EDM plugin
        /// </summary>
        /// <param name="pluginPath">Path to the plugin assembly</param>
        /// <param name="isCollectible">If true, context can be unloaded (default: true)</param>
        public OptosenseLoadContext(string pluginPath, bool isCollectible = true)
            : base(pluginPath, isCollectible)
        {
        }

        /// <summary>
        /// Loads assembly, forcing shared assemblies from default context
        /// </summary>
        protected override Assembly Load(AssemblyName assemblyName)
        {
            // Force shared assemblies to load from default context
            if (SharedAssemblies.Any(s => assemblyName.Name?.Contains(s, StringComparison.OrdinalIgnoreCase) == true))
            {
                return AssemblyLoadContext.Default.Assemblies
                    .FirstOrDefault(a => a.FullName == assemblyName.FullName);
            }

            return base.Load(assemblyName);
        }
    }
}
