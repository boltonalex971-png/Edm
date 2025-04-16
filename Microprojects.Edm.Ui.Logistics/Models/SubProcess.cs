namespace Microprojects.Edm.Ui.Logistics.Models;

/// <summary>
/// Represents combination of process and external operations defining technology or production process.
/// </summary>
public class SubProcess : DomainObject
{
    public Guid ProcessId { get; set; }
    public Guid LinkedProcessId { get; set; }
    
    public int Order { get; set; }
    
    public Process Process { get; set; } 
    public Process LinkedProcess { get; set; } 
}