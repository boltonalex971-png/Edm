using System;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;

namespace Microprojects.Edm
{
    /// <summary>
    /// Collectible assembly load context for plugin isolation.
    /// Each plugin loads in its own context, enabling independent unloading and fault isolation.
    /// </summary>
    public class EdmLoadContext : AssemblyLoadContext
    {
        private readonly AssemblyDependencyResolver _resolver;

        /// <summary>
        /// Creates a new collectible load context for plugin isolation
        /// </summary>
        /// <param name="pluginPath">Path to the plugin assembly</param>
        /// <param name="isCollectible">If true, context can be unloaded (default: true)</param>
        public EdmLoadContext(string pluginPath, bool isCollectible = true)
            : base(isCollectible: isCollectible)
        {
            _resolver = new AssemblyDependencyResolver(pluginPath);
        }

        /// <summary>
        /// Loads an assembly by name, first checking default context for shared dependencies
        /// </summary>
        protected override Assembly Load(AssemblyName assemblyName)
        {
            // First, try to load from default context (shared framework assemblies)
            var assembly = AssemblyLoadContext.Default.Assemblies
                .FirstOrDefault(a => a.FullName == assemblyName.FullName);

            if (assembly != null)
                return assembly;

            // Resolve from plugin location
            string assemblyPath = _resolver.ResolveAssemblyToPath(assemblyName);
            return assemblyPath != null ? LoadFromAssemblyPath(assemblyPath) : null;
        }

        /// <summary>
        /// Loads unmanaged DLL dependencies from plugin directory
        /// </summary>
        protected override IntPtr LoadUnmanagedDll(string unmanagedDllName)
        {
            string libraryPath = _resolver.ResolveUnmanagedDllToPath(unmanagedDllName);
            return libraryPath != null ? LoadUnmanagedDllFromPath(libraryPath) : IntPtr.Zero;
        }
    }
}
