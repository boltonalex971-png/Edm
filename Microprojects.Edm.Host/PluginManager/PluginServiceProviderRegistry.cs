using System;
using System.Collections.Generic;
using System.Reflection;
using Microprojects.Edm.Plugins;
using Microsoft.Extensions.DependencyInjection;

namespace Microprojects.Edm.Host;

// Concrete IPluginServiceProvider. Construction is deferred: built as a
// singleton in the root container, populated by Initialize() once the
// host has finished registering root-tier services and built its root
// provider. The two-phase init is necessary because each plugin's child
// container must delegate to the COMPLETE root provider (so plugin
// services can resolve IConfiguration, ILogger<T>, IPluginContainer,
// IUserService, IJobContainer, EF DbContextPool<T>, etc.), and those
// can't all be enumerated until every AddEdm() / AddPlugins() step has
// landed its descriptors.
public sealed class PluginServiceProviderRegistry : IPluginServiceProvider, IDisposable
{
    private readonly Dictionary<Guid, IServiceProvider> _byGuid = new();
    private readonly Dictionary<Assembly, Guid> _assemblyToGuid = new();
    // Maps a service type to the plugin whose own blueprint registered it.
    // Used to bridge a cross-plugin contract to its single providing plugin
    // (see ForwardingProcessDefinitionService). Only plugin-private
    // registrations are recorded — root delegations are skipped.
    private readonly Dictionary<Type, Guid> _serviceTypeToGuid = new();
    private bool _initialized;

    public void Initialize(
        IServiceProvider rootProvider,
        IPluginContainer pluginContainer,
        PluginBlueprintRegistry blueprints)
    {
        if (_initialized)
        {
            return;
        }

        var rootDescriptors = blueprints.RootDescriptorSnapshot
            ?? throw new EdmException(
                "Edm.Plugins.NoRootSnapshot",
                "Root-descriptor snapshot was never taken — AddPlugins() must run after the root tier is fully registered.");

        foreach (var plugin in pluginContainer.GetAllPlugins())
        {
            var blueprint = blueprints.GetBlueprint(plugin.Guid);
            IServiceCollection childCollection = new ServiceCollection();

            // 1. Reference-handover: every root-tier closed-type descriptor
            //    becomes a factory that delegates to the shared root
            //    provider. The child container never owns these instances;
            //    it just forwards resolution upward. Singleton lifetimes
            //    preserve identity (same root instance everywhere); root
            //    policy is that anything reachable from a plugin must be
            //    singleton-safe.
            //
            //    Open-generic descriptors (IOptions<>, ILogger<>, …) can't
            //    be wrapped by a closed-type factory, so they're carried
            //    over as-is. The child resolves them via its own open-impl
            //    machinery, but their dependencies (IOptionsFactory<>,
            //    ILoggerFactory) still delegate, so the underlying state
            //    stays shared with root.
            foreach (var d in rootDescriptors)
            {
                if (d.ServiceType.IsGenericTypeDefinition)
                {
                    childCollection.Add(d);
                }
                else
                {
                    var serviceType = d.ServiceType;
                    // Singleton: resolve directly from the root provider —
                    // identity must be preserved across plugins. Scoped /
                    // transient root services need the CURRENT request's
                    // root scope (set by PluginScopedControllerActivator
                    // via AsyncLocal) to honor scope discipline; falling
                    // back to the root provider in their absence preserves
                    // existing diagnostic behavior (the resolver will
                    // throw the same "Cannot resolve scoped" exception it
                    // would have without per-plugin DI).
                    childCollection.Add(new ServiceDescriptor(
                        serviceType,
                        d.Lifetime == ServiceLifetime.Singleton
                            ? (Func<IServiceProvider, object>)(_ => rootProvider.GetRequiredService(serviceType))
                            : (_ => (PluginRequestScope.Current ?? rootProvider).GetRequiredService(serviceType)),
                        d.Lifetime));
                }
            }

            // 2. Plugin-private descriptors overlay the root delegations.
            //    Where the plugin registers its own impl of an interface
            //    the root also has, the plugin's wins for resolutions
            //    that go through the child container.
            foreach (var d in blueprint)
            {
                childCollection.Add(d);
                if (!d.ServiceType.IsGenericTypeDefinition)
                {
                    // Record provider-of-record for each plugin-private service
                    // type. Last write wins; harmless for shared service types
                    // (never queried via the contract bridge), correct for
                    // single-implementation contract interfaces.
                    _serviceTypeToGuid[d.ServiceType] = plugin.Guid;
                }
            }

            var childProvider = childCollection.BuildServiceProvider();
            _byGuid[plugin.Guid] = childProvider;
            _assemblyToGuid[plugin.GetType().Assembly] = plugin.Guid;
        }

        _initialized = true;
    }

    public IServiceProvider GetProviderFor(IPlugin plugin)
    {
        EnsureInitialized();
        return _byGuid.TryGetValue(plugin.Guid, out var p)
            ? p
            : throw new EdmException(
                "Edm.Plugins.NoProvider",
                new Dictionary<string, object> { ["plugin"] = plugin.Guid },
                $"No service provider registered for plugin {plugin.Guid}.");
    }

    public IServiceProvider? TryGetProviderFor(Assembly assembly)
    {
        EnsureInitialized();
        return _assemblyToGuid.TryGetValue(assembly, out var g) && _byGuid.TryGetValue(g, out var p)
            ? p
            : null;
    }

    // Returns the child provider of the plugin that registered serviceType in
    // its own container, or null if no plugin provides it. The host's contract
    // forwarders use this to bridge a consumer call into the provider's scope.
    public IServiceProvider? GetProviderForServiceType(Type serviceType)
    {
        EnsureInitialized();
        return _serviceTypeToGuid.TryGetValue(serviceType, out var g) && _byGuid.TryGetValue(g, out var p)
            ? p
            : null;
    }

    private void EnsureInitialized()
    {
        if (!_initialized)
        {
            throw new EdmException(
                "Edm.Plugins.NotInitialized",
                "PluginServiceProviderRegistry was queried before Initialize() ran — UseEdm() must initialize it before the HTTP server starts.");
        }
    }

    public void Dispose()
    {
        foreach (var sp in _byGuid.Values)
        {
            (sp as IDisposable)?.Dispose();
        }
        _byGuid.Clear();
        _assemblyToGuid.Clear();
    }
}
