namespace Microprojects.Edm.Ui.Logistics.Models;

public class Order : DomainObject, IWithMeta
{
    public double Amount { get; set; }
    public string Description { get; set; }
    /// <summary>
    /// Specify when the order should start 
    /// </summary>
    public DateTime? StartDate { get; set; }
    /// <summary>
    /// Specify when the order must be completed
    /// </summary>
    public DateTime? DueDate { get; set; }
    public Guid ProcessId { get; set; }
    /// <summary>
    /// Process to launch  
    /// </summary>
    public Process Process { get; set; }
    /// <summary>
    /// Chain of  operational processes to fulfill, taken from the initial process.    
    /// </summary>
    public ICollection<OrderProcess> Processes { get; set; } = new List<OrderProcess>();
    public ICollection<Item> Items { get; set; } = new List<Item>();
    public Meta Meta { get; set; }
    
}