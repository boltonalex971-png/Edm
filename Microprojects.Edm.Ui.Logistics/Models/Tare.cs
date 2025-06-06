namespace Microprojects.Edm.Ui.Logistics.Models;

public class Tare : DomainObject
{
    public Guid TareTypeId { get; set; } 
    public TareType TareType { get; set; } 
    
    public string? Barcode { get; set; }
}
