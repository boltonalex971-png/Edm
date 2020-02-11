using System;
using System.Collections.Generic;
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
            foreach (var path in paths)
            {
                var context = (AssemblyLoadContext) Activator.CreateInstance(_config.Context.GetType());
                List<Assembly> allAssemblies = new List<Assembly>();
                if (!File.Exists(path))
                {
                    continue;
                }

                var assembly = context.LoadFromAssemblyPath(path);
                var commands = assembly.GetTypes()
                    .Where(t => typeof(ICommand).IsAssignableFrom(t))
                    .Select(t => (ICommand) Activator.CreateInstance(t))
                    .ToList();
                dic[path] = commands;

                //foreach (string dll in Directory.GetFiles(path, "*.dll"))
                //{
                //    if (dll.Contains(@"\Testcalibur.dll"))
                //        continue;
                //    var assembly = context.LoadFromAssemblyPath(dll);
                //    //allAssemblies.Add(assembly);
                //    var commands = assembly.GetTypes()
                //        .Where(t => typeof(ICommand).IsAssignableFrom(t))
                //        .Select(t => (ICommand) Activator.CreateInstance(t));
                //    dic[path] = commands;
                //}
            }

            return dic;
        }
    }

    public class EdmConfiguration
    {
        internal AssemblyLoadContext Context { get; set; } = new DefaultLoadContext();
        internal string[] PluginPaths { get; set; }

        public EdmConfiguration SetLoadContext(AssemblyLoadContext context)
        {
            Context = context;
            return this;
        }

        public EdmConfiguration SetPluginPaths(params string[] paths)
        {
            PluginPaths = paths;
            return this;
        }
    }
}
