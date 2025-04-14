namespace Microprojects.Edm.Ui.Logistics.Models;

public class History : DomainObject
{
    public Guid MetaId { get; set; }
    /// <summary>
    /// Shows when change done
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    /// <summary>
    /// New values of changed properties as JSON 
    /// </summary>
    public string JsonValue { get; set; }
    /// <summary>
    /// User name who changed the entity
    /// </summary>
    public string Author { get; set; }
    
    public Meta Meta { get; set; }
}