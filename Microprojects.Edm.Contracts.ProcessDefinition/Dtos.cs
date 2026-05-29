namespace Microprojects.Edm.Contracts.ProcessDefinition;

// A Tech process the consumer may link to. Id is the Tech Process Id; the
// consumer creates its own Operation process with the SAME Id (shared identity).
// IsCellAware reflects the process's operation plugin — gates per-cell modes.
public sealed record TechProcessSummary(
    Guid Id,
    string Name,
    string? Description,
    Guid OperationGuid,
    bool IsCellAware);

// A Tech qualifier name the consumer maps to a local grade (by name).
public sealed record TechQualifier(
    string Name,
    string? Description);
