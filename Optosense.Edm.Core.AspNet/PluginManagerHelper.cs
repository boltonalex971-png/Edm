using AutoMapper;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Newtonsoft.Json;
using Optosense.Edm.Core.Infrastructure.Mapper;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Plugins;
using Optosense.Edm.WebApi.Utils;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Security.Claims;
using System.Security.Principal;
using System.Threading.Tasks;
using Microprojects.Edm.Plugins;

namespace Optosense.Edm.Core.AspNet;

public static class PluginManagerHelper
{
    /// <summary>
    /// Plugin configuration options
    /// </summary>
    public class PluginsConfig
    {
        public IEnumerable<string> PluginsPath { get; set; }
        public string BaseDirectory { get; set; } = ".";
        public IConfiguration Configuration { get; set; }
    }

    /// <summary>
    /// Tracks load contexts for all loaded plugins, enabling unloading
    /// </summary>
    private static readonly ConcurrentDictionary<string, AssemblyLoadContext> _loadContexts = new();

    /// <summary>
    /// Registers plugins with dependency injection and creates plugin manager
    /// </summary>
    public static void AddPlugins(this IServiceCollection services, Action<PluginsConfig> config)
    {
        if (config == null)
        {
            throw new EdmException("Startup: Configuration action must be provided");
        }

        var conf = new PluginsConfig();
        config.Invoke(conf);
        
        if (conf.PluginsPath == null || !conf.PluginsPath.Any())
        {
            throw new EdmException("Startup: 'PluginsPath' option must be specified");
        }

        // Register PluginRegistry as singleton
        services.AddSingleton<PluginRegistry>();

        // Collect plugins with isolated load contexts
        var plugins = services.CollectPlugins(conf);
        
        // Create plugin manager with registry
        var registry = services.BuildServiceProvider().GetRequiredService<PluginRegistry>();
        var manager = new PluginManager(plugins, registry);
        
        services.AddSingleton<IPluginContainer>(manager);
    }

    /// <summary>
    /// Maps SPA plugins to static file endpoints
    /// </summary>
    public static void MapSpaPlugins(this IApplicationBuilder builder)
    {
        var pluginManager = builder.ApplicationServices.GetService<IPluginContainer>();
        if (pluginManager == null || !pluginManager.GetAllPlugins().Any())
        {
            throw new EdmException("Startup: plugins must be loaded by 'IServiceCollection.AddPlugins' method");
        }

        var spaPlugins = pluginManager.GetAllPlugins()
            .Where(t => t.GetType().GetCustomAttribute<PluginAttribute>(false)?.SpaPath != null)
            .ToList();
        
        foreach (var plugin in spaPlugins.OrderByDescending(p => p.Homepage?.Length ?? 0))
        {
            builder.MapSpa(plugin.GetType());
        }

        builder.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
    }

    /// <summary>
    /// Unloads a specific plugin by path
    /// </summary>
    public static async Task<bool> UnloadPluginAsync(string pluginPath)
    {
        if (_loadContexts.TryRemove(pluginPath, out var context))
        {
            try
            {
                context.Unload();
                
                // Force garbage collection to release memory
                GC.Collect();
                GC.WaitForPendingFinalizers();
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to unload plugin {pluginPath}: {ex.Message}");
            }
        }
        return false;
    }

    /// <summary>
    /// Unloads all plugins (call on application shutdown)
    /// </summary>
    public static async Task UnloadAllPluginsAsync()
    {
        foreach (var kvp in _loadContexts.ToList())
        {
            await UnloadPluginAsync(kvp.Key);
        }
    }

    private static void MapSpa(this IApplicationBuilder builder, Type plugin)
    {
        var attr = plugin.GetCustomAttribute<PluginAttribute>();
        var name = plugin.Namespace;
        var packageName = name[(name.LastIndexOf('.') + 1)..];
        var pluginPath = attr.UiRoot != null ? new PathString($"/{attr.UiRoot}") : new PathString();
        var fileProvider = new ManifestEmbeddedFileProvider(plugin.Assembly, attr.SpaPath);
        
        builder.Use(async (context, next) =>
        {
            if (context.Request.Path.StartsWithSegments(pluginPath, out var remain))
            {
                var fileInfo = fileProvider.GetFileInfo(remain);
                if (!fileInfo.Exists || string.IsNullOrEmpty(remain) || remain == "/" || remain.Value.EndsWith("index.html"))
                {
                    if (!fileInfo.Exists)
                    {
                        context.Request.Path = new PathString($"{pluginPath}/index.html");
                    }

                    if (context.User.Identity?.IsAuthenticated == true &&
                        context.User.Identity is System.Security.Principal.WindowsIdentity)
                    {
                        var jwtService = context.RequestServices.GetRequiredService<Auth.IJwtService>();
                        var selectedRole = context.Session.GetString("SelectedRole");
                        var token = jwtService.GenerateToken(context.User, selectedRole);
                        context.Response.Cookies.Append("X-Auth-Token", token, new CookieOptions
                        {
                            HttpOnly = false,
                            Secure = true,
                            SameSite = SameSiteMode.Strict,
                            Expires = DateTimeOffset.UtcNow.AddMinutes(10)
                        });
                    }
                }
            }

            await next(context);
        });

        builder.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = fileProvider,
            RequestPath = new PathString(pluginPath)
        });
    }

    /// <summary>
    /// Collects plugins from assemblies using isolated load contexts
    /// </summary>
    private static IEnumerable<IPlugin> CollectPlugins(this IServiceCollection services, PluginsConfig config)
    {
        var builder = services.AddControllers(options =>
        {
            options.RespectBrowserAcceptHeader = true;
        }).AddNewtonsoftJson(options =>
        {
            options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
            options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
            options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        });
        
        var instances = new List<IPlugin>();
        var loggerFactory = services.BuildServiceProvider().GetService<ILoggerFactory>();
        var logger = loggerFactory?.CreateLogger("PluginManagerHelper") ?? NullLogger.Instance;

        foreach (var pluginPath in config.PluginsPath)
        {
            var fullPath = Path.Combine(config.BaseDirectory, pluginPath);
            
            try
            {
                if (!File.Exists(fullPath))
                {
                    logger.LogWarning("Plugin file not found: {Path}", fullPath);
                    continue;
                }

                // Create isolated, collectible load context
                var loadContext = new OptosenseLoadContext(fullPath, isCollectible: true);
                
                // Load assembly from isolated context
                var assembly = loadContext.LoadFromAssemblyPath(fullPath);
                
                var foundTypes = assembly.GetTypes()
                    .Where(t => t.GetCustomAttribute<PluginAttribute>() != null)
                    .ToList();

                if (!foundTypes.Any())
                {
                    logger.LogWarning("No plugin types found in {Path}", fullPath);
                    continue;
                }

                // Register AutoMapper for each plugin
                builder.AddApplicationPart(assembly);
                services.AddAutoMapper(typeof(AutoMapperProfile), foundTypes.First());

                foreach (var type in foundTypes)
                {
                    try
                    {
                        var instance = (IPlugin)Activator.CreateInstance(type);
                        instances.Add(instance);

                        // Store load context for later unloading
                        _loadContexts[fullPath] = loadContext;

                        instance.InjectDependencies(services, config.Configuration);

                        logger.LogInformation(
                            "Loaded plugin {Name} ({Guid}) from {Path}",
                            instance.Name,
                            instance.Guid,
                            fullPath);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Failed to instantiate plugin type {Type}", type.FullName);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to load plugin assembly {Path}", fullPath);
            }
        }

        return instances;
    }
}

[AttributeUsage(AttributeTargets.Class)]
class PluginRoutingConvention : Attribute, IControllerModelConvention
{
    public void Apply(ControllerModel controller)
    {
        var plugin = controller.ControllerType.Assembly
            .GetTypes().Where(t => t.GetCustomAttribute(typeof(PluginAttribute)) != null
                && controller.ControllerType.Namespace.Contains(t.Namespace)).FirstOrDefault() ??
                    throw new EdmException($"No corresponding plugin found for controller {controller.ControllerType.FullName}. Beginning of controller namespace must must match plugin namespace.");
        var root = plugin.GetCustomAttribute<PluginAttribute>().UiRoot;
        var homepage = root != null ? $"{root}/" : string.Empty;
        var routeAttributes = controller.Selectors.Where(selector =>
                                                selector.AttributeRouteModel != null);
        if (routeAttributes.Any())
        {
            foreach (var attr in routeAttributes)
            {
                attr.AttributeRouteModel.Template = $"{homepage}{attr.AttributeRouteModel.Template}";
            }
        }
        else
        {
            foreach (var selector in controller.Selectors)
            {
                selector.AttributeRouteModel = new AttributeRouteModel()
                {
                    Template = $"{homepage}[controller]"
                };
            }

        }
    }
}
