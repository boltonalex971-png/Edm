using System;
using System.Collections.Generic;

namespace Microprojects.Edm.Shared.Contracts;

// Each plugin registers an implementation in DI to surface its
// WellKnownDirectoryIds. The shared DirectoryService consults this
// registry to decide which folders are "type roots" (built-in,
// immovable, undeletable) and to resolve a route-token like
// "nomenclature" or "hosts" to a concrete Guid root.
public interface IDirectoryRootRegistry
{
    IReadOnlyList<Guid> TypeRoots { get; }

    bool IsTypeRoot(Guid id);

    // Route-token → root Guid. kind is an optional sub-selector for
    // plugins whose roots split on a secondary axis (Logistics's Process
    // splits into Manufacturing/Technology/Operations via ProcessKinds).
    Guid? ResolveRoot(string entryType, string? kind = null);
}
