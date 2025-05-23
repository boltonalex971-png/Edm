namespace Microprojects.Edm.Ui.Logistics.Models;

public class OrderProcess : DomainObject
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; }
    public Guid ProcessId { get; set; }
    public Process Process { get; set; }
    
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int Ordering {get; set;}
}