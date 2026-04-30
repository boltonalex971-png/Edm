namespace Microprojects.Edm.Ui.Logistics.Models;

public class Meta : DomainObject
{
    public override Guid Id { get; set; }
    /// <summary>
    /// Type name of related principal entity
    /// </summary>
    public required string Metatype { get; set; }

    /// <summary>
    /// Creator of the entity
    /// </summary>
    public required string Owner { get; set; } = string.Empty;

    /// <summary>
    /// Name of the user who took responsibility for executing the entity
    /// (currently: the operator who launched the order's process). Null until
    /// execution starts.
    /// </summary>
    public string? Executor { get; set; }

    /// <summary>
    /// Group names having access to the entity
    /// </summary>
    public string[] Groups { get; set; } = [];
    public DateTime Created { get; set; } = DateTime.UtcNow;  
    public DateTime? Modified { get; set; }    
    public DateTime? Deleted { get; set; }
    /// <summary>
    /// Set when the entity reached its natural end-of-life (order completed,
    /// item fully consumed, tare discharged, process retired, etc.). Distinct
    /// from <see cref="Deleted"/> which represents a user-initiated removal
    /// or cancellation.
    /// </summary>
    public DateTime? Completed { get; set; }

    /// <summary>
    /// For schema-defining entities versioned via auto-fork on save (TareType,
    /// Nomenclature, Process), points at the immediate predecessor in the
    /// version chain. Null for entities created from scratch and for non-
    /// versioned entities. Type homogeneity (a fork's origin must share the
    /// same <see cref="Metatype"/>) is enforced by the fork code path.
    /// </summary>
    public Guid? OriginId { get; set; }

    public ICollection<History> History { get; set; } = new List<History>();
}