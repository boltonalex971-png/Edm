using System;
using System.Collections.Generic;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    // Surfaces Tech's WellKnownDirectoryIds (Hosts/Devices/Processes/Workplaces)
    // to the shared DirectoryService. GeneralRoot is the parent of the four
    // type roots and is NOT itself a type root.
    public sealed class TechDirectoryRootRegistry : IDirectoryRootRegistry
    {
        private static readonly Guid[] _typeRoots =
        [
            WellKnownDirectoryIds.Hosts,
            WellKnownDirectoryIds.Devices,
            WellKnownDirectoryIds.Processes,
            WellKnownDirectoryIds.Workplaces,
        ];

        public IReadOnlyList<Guid> TypeRoots => _typeRoots;

        public bool IsTypeRoot(Guid id) =>
            id != WellKnownDirectoryIds.GeneralRoot && WellKnownDirectoryIds.IsRoot(id);

        // `kind` is unused for Tech — its tree has no secondary axis like
        // Logistics's ProcessKinds. Accepted for interface compatibility.
        public Guid? ResolveRoot(string entryType, string? kind = null) =>
            WellKnownDirectoryIds.ResolveRoot(entryType);
    }
}
