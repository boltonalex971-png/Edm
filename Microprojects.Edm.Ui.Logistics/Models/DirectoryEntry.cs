namespace Microprojects.Edm.Ui.Logistics.Models;

public class DirectoryEntry : DomainObject, IWithMeta
{
    public virtual Guid? DirectoryId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    
    public required Meta Meta { get; set; }
    public Directory Directory { get; set; }
}