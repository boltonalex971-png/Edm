using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    // Stable root identifiers for the Tech directory tree. Hosts/Devices/Processes/
    // Workplaces are seeded with these Guids (matching the int Ids 1..4 of the legacy
    // Hierarchies seed rows); GeneralRoot inherits Directory.GeneralRootId (Guid.Empty).
    public static class WellKnownDirectoryIds
    {
        public static readonly Guid GeneralRoot = Directory.GeneralRootId;
        public static readonly Guid Hosts       = Guid.Parse("4d76a4e7-1d04-7a01-9000-edb0c0deca10");
        public static readonly Guid Devices     = Guid.Parse("4d76a4e7-1d04-7a02-9000-edb0c0deca10");
        public static readonly Guid Processes   = Guid.Parse("4d76a4e7-1d04-7a03-9000-edb0c0deca10");
        public static readonly Guid Workplaces  = Guid.Parse("4d76a4e7-1d04-7a04-9000-edb0c0deca10");

        public static Guid? ResolveRoot(string rootName) => rootName?.ToLowerInvariant() switch
        {
            "general"    => GeneralRoot,
            "hosts"      => Hosts,
            "devices"    => Devices,
            "processes"  => Processes,
            "workplaces" => Workplaces,
            _ => null,
        };

        public static bool IsRoot(Guid id) =>
            id == GeneralRoot || id == Hosts || id == Devices || id == Processes || id == Workplaces;
    }
}
