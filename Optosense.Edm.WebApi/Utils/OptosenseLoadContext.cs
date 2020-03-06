using Microprojects.Edm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Text;

namespace Optosense.Edm.WebApi.Utils
{
    public class OptosenseLoadContext : EdmLoadContext
    {
        private AssemblyDependencyResolver _resolver;

        public OptosenseLoadContext(string pluginLocation)
        {
            _resolver = new AssemblyDependencyResolver(pluginLocation);
        }

        protected override Assembly Load(AssemblyName assemblyName)
        {
            var assembly = Default.Assemblies.FirstOrDefault(a => a.FullName == assemblyName.FullName);
            if (assembly != null)
            {
                return assembly;
            }

            string assemblyPath = _resolver.ResolveAssemblyToPath(assemblyName);
            if (assemblyPath != null)
            {
                return LoadFromAssemblyPath(assemblyPath);
            }

            return null;
        }

        protected override IntPtr LoadUnmanagedDll(string unmanagedDllName)
        {
            string libraryPath = _resolver.ResolveUnmanagedDllToPath(unmanagedDllName);

            if (libraryPath != null)
            {
                return LoadUnmanagedDllFromPath(libraryPath);
            }

            return IntPtr.Zero;
        }
    }
}