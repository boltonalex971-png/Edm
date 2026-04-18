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
    
    public ICollection<History> History { get; set; } = new List<History>();
}