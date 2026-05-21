#nullable enable
using System;
using System.Collections.Generic;

namespace Microprojects.Edm.Domain;

public class Directory : DirectoryEntry
{
    public static Guid GeneralRootId { get; } = Guid.Empty;

    // Required to define correct self-referencing table in migration.
    public override Guid? DirectoryId { get; set; }

    public ICollection<Directory> Children { get; set; } = new List<Directory>();
}
