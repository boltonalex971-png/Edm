namespace Microprojects.Edm.Ui.Logistics.Models;

public class Item : DomainObject, IWithMeta
{
    /// <summary>
    /// Serial number of item if any
    /// </summary>
    public string? SerialNo { get; set; }   
    
    /// <summary>
    /// Number of available units
    /// </summary>
    public double Quantity { get; set; }
  
    /// <summary>
    /// Item nomenclature
    /// </summary>
    public Nomenclature Nomenclature { get; set; }
    public required Guid NomenclatureId { get; set; }

    /// <summary>
    /// Tare
    /// </summary>
    public Tare? Tare { get; set; }
    public Guid? TareId { get; set; }

    /// <summary>
    /// Address inside tare when <see cref="TareType.Dimensions"/> > 0.
    /// Must be unique per tare among active items (validated in service).
    /// </summary>
    public int? Address { get; set; }
    
    /// <summary>
    /// The process where the item has been assembled
    /// </summary>
    public Process? Process { get; set; }
    public Guid? ProcessId { get; set; }
    
    /// <summary>
    /// The order where the item has been assigned
    /// </summary>
    public Order? Order { get; set; }
    public Guid? OrderId { get; set; }

    public Supply? Supply { get; set; }
    public Guid? SupplyId { get; set; }

    /// <summary>
    /// Optional process grade assigned to this output item. Only meaningful when
    /// <see cref="ProcessId"/> is set. Locked once the item enters a tare.
    /// </summary>
    public Grade? Grade { get; set; }
    public Guid? GradeId { get; set; }

    public Meta Meta { get; set; }
}