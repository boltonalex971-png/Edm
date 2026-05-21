using System;
using System.Collections.Generic;
using System.Linq;
using Microprojects.Edm.Shared.Contracts;

namespace Microprojects.Edm.Shared.Services;

// Aggregates all per-plugin IDirectoryRootRegistry implementations into a
// single IDirectoryRootRegistry that consumers (EntriesControllerBase,
// DirectoriesController, DirectoryService) inject. Without this, plugins
// would overwrite each other's IDirectoryRootRegistry registration in the
// host's service collection — the last-registered plugin would win and
// every other plugin's leaf controllers would fail to resolve their
// own entry types.
public sealed class CompositeDirectoryRootRegistry : IDirectoryRootRegistry
{
    private readonly IReadOnlyList<IPluginDirectoryRootRegistry> _registries;

    public CompositeDirectoryRootRegistry(IEnumerable<IPluginDirectoryRootRegistry> registries)
    {
        _registries = registries.ToList();
    }

    public IReadOnlyList<Guid> TypeRoots =>
        _registries.SelectMany(r => r.TypeRoots).Distinct().ToList();

    public bool IsTypeRoot(Guid id) =>
        _registries.Any(r => r.IsTypeRoot(id));

    public Guid? ResolveRoot(string entryType, string? kind = null)
    {
        foreach (var r in _registries)
        {
            var hit = r.ResolveRoot(entryType, kind);
            if (hit is not null)
            {
                return hit;
            }
        }
        return null;
    }
}
