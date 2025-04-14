namespace Microprojects.Edm.Ui.Logistics.Models;

public class AssignmentItem : DomainObject
{
    public Guid AssignmentId { get; set; }
    public Guid TareId { get; set; }
    
    public double Amount { get; set; }
    
}