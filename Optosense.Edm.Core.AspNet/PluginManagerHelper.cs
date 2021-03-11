using Microprojects.Edm;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.AspNet
{
    public static class PluginManagerHelper
    {
        public class PluginsConfig
        {
            public IEnumerable<string> PluginsPath { get; set; }
            public string BaseDirectory { get; set; } = ".";
        }

        private static IEnumerable<IPlugin> CollectPlugins(string basePath, IEnumerable<string> paths)
        {
            //var plugins = AppDomain.CurrentDomain.GetAssemblies()
            //    .SelectMany(a => a.GetTypes().Where(t => t.GetCustomAttribute(typeof(PluginAttribute)) != null))
            //    .ToList();
            var plugins = paths.SelectMany(p =>
            {
                var fullPath = Path.Combine(basePath, p);
                if (File.Exists(fullPath))
                {
                    var assembly = AssemblyLoadContext.Default.LoadFromAssemblyPath(fullPath);
                    var found = assembly.GetTypes().Where(t => t.GetCustomAttribute(typeof(PluginAttribute)) != null);
                    return found;
                }
                return Enumerable.Empty<Type>();
            });
            var instances = plugins
                .Select(t => Activator.CreateInstance(t))
                .Cast<IPlugin>()
                .ToList();
            return instances;
        }

        public static void AddPlugins(this IServiceCollection service, Action<PluginsConfig> config)
        {
            if (config == null)
            {
                throw new EdmException("Startup: Configuration action must be provided");
            }
            var conf = new PluginsConfig();
            config.Invoke(conf);
            if (conf.PluginsPath == null)
            {
                throw new EdmException("Startup: 'PluginsPath' option must be specified");
            }
            var plugins = CollectPlugins(conf.BaseDirectory, conf.PluginsPath);
            var manager = new PluginManager(plugins);
            service.AddSingleton<IPluginContainer>(manager);
        }

        public static void MapSpaPlugins(this IApplicationBuilder builder)
        {
            var pluginManager = builder.ApplicationServices.GetService<IPluginContainer>();
            if (!pluginManager.GetAllPlugins().Any())
            {
                throw new EdmException("Startup: plugins must be loaded by 'IServiceCollection.AddPlugins' method");
            }

            var spaPlugins = pluginManager.GetAllPlugins()
                .Where(t => t.GetType().GetCustomAttribute<PluginAttribute>(false)?.SpaPath != null)
                .ToList();
            foreach (var plugin in spaPlugins)
            {
                builder.MapSpa(plugin.GetType());
            }
        }

        private static void MapSpa(this IApplicationBuilder builder, Type plugin)
        {
            var attr = plugin.GetCustomAttribute<PluginAttribute>();
            var name = plugin.Namespace;
            var packageName = name.Substring(name.LastIndexOf('.') + 1);
            var pluginPath = $"/{attr.UiRoot}/{packageName.ToLower()}";
            var fileProvider = new ManifestEmbeddedFileProvider(plugin.Assembly, attr.SpaPath);
            builder.Use((context, next) =>
            {
                if (context.Request.Path.StartsWithSegments(pluginPath, out var remain))
                {
                    var fileInfo = fileProvider.GetFileInfo(remain);
                    if (!fileInfo.Exists)
                    {
                        context.Request.Path = new PathString($"{pluginPath}/index.html");
                    }
                }
                return next();
            });

            builder.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = fileProvider,
                RequestPath = new PathString(pluginPath)
            });
        }
    }
}
