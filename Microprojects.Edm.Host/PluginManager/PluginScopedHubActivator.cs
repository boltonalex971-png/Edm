using System;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microprojects.Edm.Plugins;

namespace Microprojects.Edm.Host;

// Same idea as PluginScopedControllerActivator, but for SignalR hubs.
// Hub instances are short-lived (per hub method invocation) and SignalR's
// default activator already opens a scope around each invocation;
// custom activators get a fresh IServiceProvider per hub via
// IServiceProvider in Create. We swap in the owning plugin's provider
// before resolving so the hub's constructor sees the plugin's services.
public sealed class PluginScopedHubActivator<THub> : IHubActivator<THub>
    where THub : Hub
{
    private const string ScopeKey = "__edm_plugin_hub_scope__";

    private readonly IPluginServiceProvider _plugins;
    private readonly IServiceProvider _rootScope;

    public PluginScopedHubActivator(IPluginServiceProvider plugins, IServiceProvider rootScope)
    {
        _plugins = plugins;
        _rootScope = rootScope;
    }

    public THub Create()
    {
        var hubType = typeof(THub);
        var pluginProvider = _plugins.TryGetProviderFor(hubType.Assembly);

        if (pluginProvider is null)
        {
            return ActivatorUtilities.CreateInstance<THub>(_rootScope);
        }

        // Publish the request's root scope so plugin-tier factories can
        // delegate scoped root services into it (see PluginRequestScope
        // and the controller activator).
        PluginRequestScope.Current = _rootScope;

        var scope = pluginProvider.CreateScope();
        // SignalR doesn't expose HttpContext.Items to the activator the
        // same way MVC does, so we stash the scope on a per-instance
        // hidden field via AsyncLocal. Release uses the same reference
        // through a ConditionalWeakTable below.
        var hub = ActivatorUtilities.CreateInstance<THub>(scope.ServiceProvider);
        _liveScopes.Add(hub, scope);
        return hub;
    }

    public void Release(THub hub)
    {
        if (_liveScopes.TryGetValue(hub, out var scope))
        {
            _liveScopes.Remove(hub);
            scope.Dispose();
        }
        PluginRequestScope.Current = null;
        (hub as IDisposable)?.Dispose();
    }

    private static readonly System.Runtime.CompilerServices.ConditionalWeakTable<THub, IServiceScope> _liveScopes = new();
}
