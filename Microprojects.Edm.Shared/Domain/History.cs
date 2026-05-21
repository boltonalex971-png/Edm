#nullable enable
using System;

namespace Microprojects.Edm.Domain;

public class History : DomainObject
{
    public Guid MetaId { get; set; }

    // When the change occurred.
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // New values of changed properties as JSON.
    public string JsonValue { get; set; } = null!;

    // User who made the change.
    public string Author { get; set; } = null!;

    public Meta Meta { get; set; } = null!;
}
