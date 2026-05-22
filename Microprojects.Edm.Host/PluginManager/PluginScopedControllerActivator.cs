using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microprojects.Edm.Plugins;

namespace Microprojects.Edm.Host;

// Routes controller activation to the owning plugin's IServiceProvider.
// Replaces ASP.NET Core's default DefaultControllerActivator so each
// plugin's controllers can only resolve dependencies from that plugin's
// container (with delegation to root for shared services). Controllers
// in the host itself (e.g. /status endpoint) — or any controller whose
// assembly isn't tracked as a plugin — fall back to the root request
// scope, preserving existing behavior.
public sealed class PluginScopedControllerActivator : IControllerActivator
{
    private const string ScopeKey = "__edm_plugin_controller_scope__";

    private readonly IPluginServiceProvider _plugins;

    public PluginScopedControllerActivator(IPluginServiceProvider plugins)
    {
        _plugins = plugins;
    }

    public object Create(ControllerContext context)
    {
        var controllerType = context.ActionDescriptor.ControllerTypeInfo.AsType();
        var pluginProvider = _plugins.TryGetProviderFor(controllerType.Assembly);

        if (pluginProvider is null)
        {
            // Host-owned controllers (no plugin assembly): resolve from
            // the request's normal scope.
            return ActivatorUtilities.CreateInstance(
                context.HttpContext.RequestServices,
                controllerType);
        }

        // Publish the request's root scope so the plugin container's
        // reference-handover factories can route scoped root-tier
        // services (e.g. IUserService) into it. See PluginRequestScope.
        PluginRequestScope.Current = context.HttpContext.RequestServices;

        // Open a request-bound scope on the plugin's provider so any
        // scoped plugin services live for exactly this request. Disposed
        // in Release.
        var scope = pluginProvider.CreateScope();
        context.HttpContext.Items[ScopeKey] = scope;
        return ActivatorUtilities.CreateInstance(scope.ServiceProvider, controllerType);
    }

    public void Release(ControllerContext context, object controller)
    {
        if (context.HttpContext.Items.TryGetValue(ScopeKey, out var stashed)
            && stashed is IServiceScope scope)
        {
            context.HttpContext.Items.Remove(ScopeKey);
            scope.Dispose();
        }
        PluginRequestScope.Current = null;
        (controller as IDisposable)?.Dispose();
    }
}
