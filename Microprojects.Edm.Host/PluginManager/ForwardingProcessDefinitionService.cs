using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Contracts.ProcessDefinition;
using Microsoft.Extensions.DependencyInjection;

namespace Microprojects.Edm.Host;

// Root-tier bridge for the ProcessDefinition contract. Registered before
// AddPlugins so it lands in the root descriptor snapshot and is delegated
// into every plugin's child container. A consumer plugin (Logistics) that
// does NOT register its own implementation resolves this forwarder; it opens
// a fresh scope in the provider plugin's (Technologies) container — where the
// real InProcessProcessDefinitionService shadows this root registration — and
// delegates. Each call gets its own provider scope (and DbContext), awaited
// before the scope is disposed.
public sealed class ForwardingProcessDefinitionService : IProcessDefinitionService
{
    private readonly PluginServiceProviderRegistry _registry;

    public ForwardingProcessDefinitionService(PluginServiceProviderRegistry registry)
    {
        _registry = registry;
    }

    public async Task<IReadOnlyList<TechProcessSummary>> ListProcessesAsync(
        CancellationToken cancellationToken = default)
    {
        using var scope = ProviderScope();
        var impl = scope.ServiceProvider.GetRequiredService<IProcessDefinitionService>();
        return await impl.ListProcessesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TechQualifier>> ListQualifiersAsync(
        Guid processId,
        CancellationToken cancellationToken = default)
    {
        using var scope = ProviderScope();
        var impl = scope.ServiceProvider.GetRequiredService<IProcessDefinitionService>();
        return await impl.ListQualifiersAsync(processId, cancellationToken);
    }

    private IServiceScope ProviderScope()
    {
        var provider = _registry.GetProviderForServiceType(typeof(IProcessDefinitionService))
            ?? throw new EdmException(
                "Edm.Contracts.NoProvider",
                "No plugin provides IProcessDefinitionService.");
        return provider.CreateScope();
    }
}
