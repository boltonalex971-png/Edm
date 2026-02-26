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
                            Expires = DateTimeOffset.UtcNow.AddMinutes(10) // Short lived cookie for handoff
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
