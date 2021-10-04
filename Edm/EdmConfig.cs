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
    public static class EdmConfig
    {
        static EdmConfiguration _config;
        internal static Dictionary<string, IEnumerable<Type>> Plugins { get; set; }

        public static void Configure(Action<EdmConfiguration> configure)    
        {
            _config = new EdmConfiguration();
            configure(_config);
            Plugins = LoadPlugins(_config.PluginPaths);
        }

        public static void AddEdmCommands(this IServiceCollection services, Action<EdmConfiguration> configure)
        {
            services.AddSingleton<ICommandContainer, CommandManager>();
            _config = new EdmConfiguration();
            configure(_config);
            Plugins = LoadPlugins(_config.PluginPaths);
            foreach (var plugin in Plugins.SelectMany(p => p.Value))
            {
                services.AddTransient(plugin);
            }
        }

        private static Dictionary<string, IEnumerable<Type>> LoadPlugins(IEnumerable<string> paths)
        {
            var dic = new Dictionary<string, IEnumerable<Type>>();
            // Load plugin commands
            foreach (var path in paths)
            {
                var context = AssemblyLoadContext.Default; //(AssemblyLoadContext) Activator.CreateInstance(_config.Context, path);
                if (!File.Exists(path))
                {
                    continue;
                }

                var name = new AssemblyName(Path.GetFileNameWithoutExtension(path));
                var assembly = context.LoadFromAssemblyName(name);

                var commands = assembly.ExportedTypes
                    .Where(t => typeof(ICommand).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract)
                    .ToList();
                dic[assembly.FullName] = commands;
            }

            return dic;
        }
    }

    public class EdmConfiguration
    {
        internal Type Context { get; set; } = AssemblyLoadContext.Default.GetType();
        internal IEnumerable<string> PluginPaths { get; set; } = Enumerable.Empty<string>();
        internal ILogger DefaultLogger { get; set; }

        public EdmConfiguration SetLoadContext(Type type)
        {
            if (!typeof(EdmLoadContext).IsAssignableFrom(type))
            {
                throw new EdmException($"The load context must be inherit from {typeof(EdmLoadContext).FullName}");
            }
            Context = type;
            return this;
        }

        public EdmConfiguration SetPluginPaths(params string[] paths)
        {
            PluginPaths = paths.Concat(PluginPaths);
            return this;
        }

        public EdmConfiguration SetPluginAssemblies(params Assembly[] assemblies)
        {
            PluginPaths = assemblies.Select(a => a.Location).Concat(PluginPaths);
            return this;
        }

        public EdmConfiguration SetDefaultLogger(ILogger logger)
        {
            Logger.SetLogger(logger);
            return this;
        }
    }
}
