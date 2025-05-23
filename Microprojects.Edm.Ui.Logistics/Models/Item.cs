namespace Microprojects.Edm.Ui.Logistics.Models;

public class Item : DomainObject, IWithMeta
{
    /// <summary>
    /// Name of shipment for incoming items
    /// </summary>
    public string? Shipment { get; set; }
    
    /// <summary>
    /// Shipment external id for integration with accounting system  
    /// </summary>
    public string? ShipmentExternalId { get; set; }
    
    /// <summary>
    /// Serial number of item if any
    /// </summary>
    public string? SerialNo { get; set; }   
    
    /// <summary>
    /// Barcode of item if any
    /// </summary>
    public string? Barcode { get; set; }
    
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
    /// Parent item the current one is part of
    /// </summary>
    public Item Origin { get; set; }
    public Guid? OriginId { get; set; }
    
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
    
    public Meta Meta { get; set; }
}