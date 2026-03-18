namespace Microprojects.Edm.Ui.Logistics.Models;

public class Grade : DomainObject
{
    public Guid ProcessId { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public string? QualifierName { get; set; }
    public Process Process { get; set; }
}