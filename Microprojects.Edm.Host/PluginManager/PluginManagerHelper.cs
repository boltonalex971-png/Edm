using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microprojects.Edm.Plugins;

namespace Microprojects.Edm.Host;

public static class PluginManagerHelper
{
    /// <summary>
    /// Plugin configuration options
    /// </summary>
    public class PluginsConfig
    {
        public IEnumerable<string> PluginsPaths { get; set; }
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
        
        if (conf.PluginsPaths == null || !conf.PluginsPaths.Any())
        {
            throw new EdmException("Startup: 'PluginsPaths' option must be specified");
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

        foreach (var dllPath in EnumerateCandidateDlls(config, logger))
        {
            try
            {
                var loadContext = new EdmPluginLoadContext(dllPath, isCollectible: true);
                var assembly = loadContext.LoadFromAssemblyPath(dllPath);

                var foundTypes = assembly.GetTypes()
                    .Where(t => t.GetCustomAttribute<PluginAttribute>() != null)
                    .ToList();

                if (!foundTypes.Any())
                {
                    logger.LogDebug("Skipping non-plugin DLL {Path}", dllPath);
                    loadContext.Unload();
                    continue;
                }

                builder.AddApplicationPart(assembly);

                foreach (var type in foundTypes)
                {
                    try
                    {
                        var instance = (IPlugin)Activator.CreateInstance(type);
                        instances.Add(instance);

                        _loadContexts[dllPath] = loadContext;

                        instance.InjectDependencies(services, config.Configuration);

                        logger.LogInformation(
                            "Loaded plugin {Name} ({Guid}) from {Path}",
                            instance.Name,
                            instance.Guid,
                            dllPath);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Failed to instantiate plugin type {Type}", type.FullName);
                    }
                }
            }
            catch (System.Reflection.ReflectionTypeLoadException ex)
            {
                var loaderDetail = string.Join(
                    Environment.NewLine,
                    (ex.LoaderExceptions ?? Array.Empty<Exception?>())
                        .Where(e => e is not null)
                        .Select(e => $"  - {e!.GetType().FullName}: {e.Message}"));
                logger.LogDebug(
                    "Skipping {Path}: type load failed (likely a transitive dep, not a plugin). LoaderExceptions:{NewLine}{Detail}",
                    dllPath, Environment.NewLine, loaderDetail);
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Skipping {Path}: load failed (likely a non-plugin DLL)", dllPath);
            }
        }

        return instances;
    }

    /// <summary>
    /// Walks each configured folder and yields candidate DLL paths.
    /// Top-level *.dll files are scanned in full. For one-level subfolders only the
    /// folder-name-matching DLL is considered (i.e. &lt;X&gt;/&lt;X&gt;.dll), which both supports a
    /// future bundle layout of Plugins/&lt;Name&gt;/&lt;Name&gt;.dll and skips noise like
    /// EntityFrameworkCore.Design's BuildHost-netcore/ folder.
    /// DLLs whose assembly name matches an assembly already loaded in the host's default
    /// load context are filtered out — they are shared deps the plugin folder happens to
    /// contain (e.g., Microprojects.Edm.dll), and loading them into a plugin ALC would
    /// duplicate their types in the AppDomain.
    /// </summary>
    private static IEnumerable<string> EnumerateCandidateDlls(PluginsConfig config, ILogger logger)
    {
        var hostAssemblyNames = new HashSet<string>(
            AssemblyLoadContext.Default.Assemblies
                .Select(a => a.GetName().Name)
                .Where(n => !string.IsNullOrEmpty(n)),
            StringComparer.OrdinalIgnoreCase);

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var candidates = new List<string>();

        foreach (var folder in config.PluginsPaths)
        {
            if (string.IsNullOrWhiteSpace(folder))
            {
                continue;
            }

            var fullFolder = Path.GetFullPath(Path.Combine(config.BaseDirectory, folder));
            if (!Directory.Exists(fullFolder))
            {
                logger.LogWarning("Plugin folder not found: {Path}", fullFolder);
                continue;
            }

            foreach (var dll in Directory.EnumerateFiles(fullFolder, "*.dll", SearchOption.TopDirectoryOnly))
            {
                Consider(dll);
            }

            foreach (var sub in Directory.EnumerateDirectories(fullFolder))
            {
                var name = Path.GetFileName(sub);
                var primary = Path.Combine(sub, name + ".dll");
                if (File.Exists(primary))
                {
                    Consider(primary);
                }
            }
        }

        candidates.Sort(StringComparer.OrdinalIgnoreCase);
        return candidates;

        void Consider(string dll)
        {
            if (!seen.Add(dll))
            {
                return;
            }

            string name;
            try
            {
                name = AssemblyName.GetAssemblyName(dll).Name;
            }
            catch (BadImageFormatException)
            {
                return; // not a managed assembly
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Skipping unreadable DLL {Path}", dll);
                return;
            }

            if (name != null && hostAssemblyNames.Contains(name))
            {
                logger.LogDebug("Skipping {Path}: shared with host's default load context", dll);
                return;
            }

            candidates.Add(dll);
        }
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
