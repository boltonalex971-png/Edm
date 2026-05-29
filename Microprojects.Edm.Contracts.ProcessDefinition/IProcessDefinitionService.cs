namespace Microprojects.Edm.Contracts.ProcessDefinition;

// Design-time, read-only contract: lets a consumer plugin (Logistics)
// enumerate the provider plugin's (Technologies) processes and their
// qualifiers when linking a Logistics Operation process to a Tech process.
//
// Uni-directional (consumer -> provider). The implementation lives in the
// provider plugin; consumers inject this interface and the host bridges the
// call into the provider's plugin scope (see ForwardingProcessDefinitionService).
public interface IProcessDefinitionService
{
    Task<IReadOnlyList<TechProcessSummary>> ListProcessesAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TechQualifier>> ListQualifiersAsync(
        Guid processId,
        CancellationToken cancellationToken = default);
}
