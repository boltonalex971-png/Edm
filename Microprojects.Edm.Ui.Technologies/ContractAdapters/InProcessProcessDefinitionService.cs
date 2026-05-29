using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Contracts.ProcessDefinition;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Ui.Technologies.Contracts;

namespace Microprojects.Edm.Ui.Technologies.ContractAdapters;

// In-process implementation of the ProcessDefinition contract. Registered in
// the Technologies plugin container; reached from other plugins through the
// host's ForwardingProcessDefinitionService bridge. Adapts Tech's internal
// IProcessService + plugin manifest into the transport-neutral contract DTOs.
internal sealed class InProcessProcessDefinitionService : IProcessDefinitionService
{
    private readonly IProcessService _processes;
    private readonly IPluginContainer _plugins;

    public InProcessProcessDefinitionService(IProcessService processes, IPluginContainer plugins)
    {
        _processes = processes;
        _plugins = plugins;
    }

    public async Task<IReadOnlyList<TechProcessSummary>> ListProcessesAsync(
        CancellationToken cancellationToken = default)
    {
        var all = await _processes.GetAll();
        return all
            .Select(p => new TechProcessSummary(
                p.Id,
                p.Name,
                p.Description,
                p.OperationGuid,
                IsCellAware(p.OperationGuid)))
            .ToList();
    }

    public async Task<IReadOnlyList<TechQualifier>> ListQualifiersAsync(
        Guid processId,
        CancellationToken cancellationToken = default)
    {
        var qualifiers = await _processes.GetQualifiers(processId);
        return qualifiers
            .Select(q => new TechQualifier(q.Name, q.Description))
            .ToList();
    }

    private bool IsCellAware(Guid operationGuid)
    {
        var plugin = _plugins.GetMonitor(operationGuid);
        var attribute = plugin?.GetType().GetCustomAttribute<OperationPluginAttribute>();
        return attribute?.IsCellAware ?? false;
    }
}
