#nullable enable
using System;
using System.Collections.Generic;

namespace Microprojects.Edm.Domain;

public class Meta : DomainObject
{
    public override Guid Id { get; set; }

    // Type name of related principal entity
    public required string Metatype { get; set; }

    // Creator of the entity
    public required string Owner { get; set; } = string.Empty;

    // Name of the user who took responsibility for executing the entity
    // (currently: the operator who launched the order's process). Null until
    // execution starts.
    public string? Executor { get; set; }

    // Group names having access to the entity
    public string[] Groups { get; set; } = [];

    public DateTime Created { get; set; } = DateTime.UtcNow;
    public DateTime? Modified { get; set; }
    public DateTime? Deleted { get; set; }

    // Set when the entity reached its natural end-of-life (order completed,
    // item fully consumed, tare discharged, process retired, etc.). Distinct
    // from Deleted which represents a user-initiated removal or cancellation.
    public DateTime? Completed { get; set; }

    // For schema-defining entities versioned via auto-fork on save (TareType,
    // Nomenclature, Process), points at the immediate predecessor in the
    // version chain. Null for entities created from scratch and for non-
    // versioned entities. Type homogeneity (a fork's origin must share the
    // same Metatype) is enforced by the fork code path.
    public Guid? OriginId { get; set; }

    public ICollection<History> History { get; set; } = new List<History>();
}
