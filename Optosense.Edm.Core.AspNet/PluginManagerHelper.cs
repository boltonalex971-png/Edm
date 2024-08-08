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
using Newtonsoft.Json;
using Optosense.Edm.Core.Infrastructure.Mapper;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Plugins;
using Optosense.Edm.WebApi.Utils;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Runtime.Versioning;
using System.Security.Claims;
using System.Security.Principal;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.AspNet;

public static class PluginManagerHelper
{
    public class PluginsConfig
    {
        public IEnumerable<string> PluginsPath { get; set; }
        public string BaseDirectory { get; set; } = ".";
        public IConfiguration Configuration { get; set; }
    }

    [SupportedOSPlatform("windows")]
    public static IApplicationBuilder UseAuthenticatedUserInfo(this IApplicationBuilder builder)
    {
        builder.Use(async (context, next) =>
        {
            if (!context.User.Identity.IsAuthenticated && 
                // Not an intercom call
                !context.Request.Path.StartsWithSegments($"/{IntercomHub.Hub}") &&
                // Not a gRPC call
                !context.Request.Path.StartsWithSegments($"/Optosense.Edm.JobExecutor"))
            {
                await context.ChallengeAsync();
                return;
            }
            
            await next();
        });

        return builder;
    }

    public static IApplicationBuilder UseFakeUserInfo(this IApplicationBuilder builder)
    {
        builder.Use(async (context, next) =>
        {
            if (!context.User.Identity.IsAuthenticated)
            {
                var authProperties = new AuthenticationProperties
                {
                    //IsPersistent = true
                };
                var claimsIdentity = new ClaimsIdentity(
                    new List<Claim>
                    {
                        new Claim(ClaimTypes.Name, "User"),
                        new Claim(ClaimTypes.Role, "Admin"),
                        new Claim("Groups", "1"), // Group sid
                        //new Claim("Groups", "Group 2"),
                        //new Claim("Groups", "Group 3"),
                    },
                    CookieAuthenticationDefaults.AuthenticationScheme);
                var configuration = builder.ApplicationServices.GetRequiredService<IConfiguration>();
                var roles = configuration.GetSection("Edm:Auth:Roles").GetChildren()
                    .Select(c => c.Key).ToList();
                roles.ForEach(r => claimsIdentity.AddClaim(new Claim("Roles", r)));
                await context.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity),
                    authProperties);
            }

            await next(context);
        });

        return builder;
    }

    public static void AddPlugins(this IServiceCollection services, Action<PluginsConfig> config)
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

        var plugins = services.CollectPlugins(conf);
        var manager = new PluginManager(plugins);
        services.AddSingleton<IPluginContainer>(manager);
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
        foreach (var plugin in spaPlugins.OrderByDescending(p => p.Homepage?.Length ?? 0))
        {
            builder.MapSpa(plugin.GetType());
        }

        builder.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });

    }

    private static void MapSpa(this IApplicationBuilder builder, Type plugin)
    {
        var attr = plugin.GetCustomAttribute<PluginAttribute>();
        var name = plugin.Namespace;
        var packageName = name[(name.LastIndexOf('.') + 1)..];
        var pluginPath = attr.UiRoot != null ? new PathString($"/{attr.UiRoot}") : new PathString(); //$"/{attr.UiRoot}/{packageName.ToLower()}";
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
                //return Task.CompletedTask;
            }

            return next();
        });

        builder.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = fileProvider,
            RequestPath = new PathString(pluginPath)
        });
    }

    private static IEnumerable<IPlugin> CollectPlugins(this IServiceCollection services, PluginsConfig config)
    {
        var builder = services.AddControllers(options =>
        {
            options.RespectBrowserAcceptHeader = true;
            //options.Conventions.Add(new PluginRoutingConvention());
        }).AddNewtonsoftJson(options =>
        {
            options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
            options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
            options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        });
        var instances = new List<IPlugin>();
        foreach (var plugin in config.PluginsPath)
        {
            var fullPath = Path.Combine(config.BaseDirectory, plugin);
            if (File.Exists(fullPath))
            {
                var assembly = AssemblyLoadContext.Default.LoadFromAssemblyPath(fullPath);
                var found = assembly.GetTypes().Where(t => t.GetCustomAttribute(typeof(PluginAttribute)) != null);
                if (found.Any())
                {
                    builder.AddApplicationPart(assembly);
                    services.AddAutoMapper(typeof(AutoMapperProfile), found.First());
                    foreach (var type in found)
                    {
                        var instance = (IPlugin)Activator.CreateInstance(type);
                        instances.Add(instance);
                        instance.InjectDependencies(services, config.Configuration);
                    }
                }
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
