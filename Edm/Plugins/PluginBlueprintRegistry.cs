using System;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;

namespace Microprojects.Edm.Plugins;

// Holds each plugin's deferred IServiceCollection. Populated during
// PluginManagerHelper.CollectPlugins (one collection per discovered
// plugin, holding only that plugin's own registrations). Consumed once
// by PluginServiceProviderRegistry.Initialize after the host has built
// its root provider — at which point we know the full set of root-tier
// descriptors to delegate into each plugin's child container.
public sealed class PluginBlueprintRegistry
{
    private readonly Dictionary<Guid, IServiceCollection> _byPluginGuid = new();
    private readonly object _gate = new();

    public void Register(Guid pluginGuid, IServiceCollection blueprint)
    {
        lock (_gate)
        {
            _byPluginGuid[pluginGuid] = blueprint;
        }
    }

    public IServiceCollection GetBlueprint(Guid pluginGuid)
    {
        lock (_gate)
        {
            return _byPluginGuid.TryGetValue(pluginGuid, out var bp)
                ? bp
                : throw new EdmException(
                    "Edm.Plugins.NoBlueprint",
                    new Dictionary<string, object> { ["plugin"] = pluginGuid },
                    $"No service-collection blueprint registered for plugin {pluginGuid}.");
        }
    }

    // Snapshot of root-tier descriptors taken just before AddPlugins runs.
    // The PluginServiceProviderRegistry mirrors this list into each
    // plugin's child collection (with delegating factories) so a plugin
    // service can resolve any root service via the shared root provider.
    public IServiceCollection? RootDescriptorSnapshot { get; set; }
}
