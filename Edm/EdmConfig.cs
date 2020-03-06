using Microprojects.Edm.Log;
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
        internal static Dictionary<string, IEnumerable<ICommand>> Plugins { get; set; }

        public static void Configure(Action<EdmConfiguration> configure)    
        {
            _config = new EdmConfiguration();
            configure(_config);
            Plugins = LoadPlugins(_config.PluginPaths);
        }

        private static Dictionary<string, IEnumerable<ICommand>> LoadPlugins(string[] paths)
        {
            var dic = new Dictionary<string, IEnumerable<ICommand>>();
            
            // Load default commands
            //var commands = Assembly.GetExecutingAssembly().ExportedTypes
            //        .Where(t => typeof(ICommand).IsAssignableFrom(t) && !t.IsAbstract)
            //        .Select(t => (ICommand) Activator.CreateInstance(t))
            //        .ToList();
            //dic[Assembly.GetExecutingAssembly().FullName] = commands;

            // Load plugin commands
            foreach (var path in paths)
            {
                var context = (AssemblyLoadContext) Activator.CreateInstance(_config.Context, path);
                if (!File.Exists(path))
                {
                    continue;
                }

                var name = new AssemblyName(Path.GetFileNameWithoutExtension(path));
                var assembly = context.LoadFromAssemblyName(name);

                var commands = assembly.ExportedTypes
                    .Where(t => typeof(ICommand).IsAssignableFrom(t))
                    .Select(t => (ICommand) Activator.CreateInstance(t))
                    .ToList();
                dic[assembly.FullName] = commands;

                //var commandCollection = new List<ICommand>();
                //foreach (var dll in Directory.GetFiles(path, "*.dll"))
                //{
                //    //if (dll.Contains(@"\Testcalibur.dll"))
                //    //    continue;
                //    var assembly = context.LoadFromAssemblyPath(dll);
                //    //allAssemblies.Add(assembly);
                //    var commands = assembly.GetTypes()
                //        .Where(t => typeof(ICommand).IsAssignableFrom(t))
                //        .Select(t => (ICommand) Activator.CreateInstance(t))
                //        .ToList();
                //    if (commands.Any())
                //    {
                //        commandCollection.AddRange(commands);
                //    }
                //}

                //dic[path] = commandCollection;
            }

            return dic;
        }
    }

    public class EdmConfiguration
    {
        internal Type Context { get; set; } = AssemblyLoadContext.Default.GetType();
        internal string[] PluginPaths { get; set; }
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
            PluginPaths = paths;
            return this;
        }

        public EdmConfiguration SetDefaultLogger(ILogger logger)
        {
            Logger.SetLogger(logger);
            return this;
        }
    }
}
