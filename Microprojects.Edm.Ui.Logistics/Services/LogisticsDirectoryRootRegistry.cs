using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.Services;

// Surfaces Logistics's WellKnownDirectoryIds to the shared DirectoryService.
internal sealed class LogisticsDirectoryRootRegistry : IDirectoryRootRegistry
{
    private static readonly Guid[] _typeRoots =
    [
        WellKnownDirectoryIds.Nomenclatures,
        WellKnownDirectoryIds.Manufacturing,
        WellKnownDirectoryIds.Technology,
        WellKnownDirectoryIds.Operations,
        WellKnownDirectoryIds.Specifications,
        WellKnownDirectoryIds.TareTypes,
    ];

    public IReadOnlyList<Guid> TypeRoots => _typeRoots;

    public bool IsTypeRoot(Guid id) => WellKnownDirectoryIds.IsTypeRoot(id);

    public Guid? ResolveRoot(string entryType, string? kind = null) =>
        WellKnownDirectoryIds.ResolveRoot(entryType, kind);
}
