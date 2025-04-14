namespace Microprojects.Edm.Ui.Logistics.Models;

public class Item : DomainObject
{
    public Guid? OriginId { get; set; }
    
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
    /// Amount of available units
    /// </summary>
    public int Quantity { get; set; }
  
    public required Guid NomenclatureId { get; set; }

    /// <summary>
    /// Item nomenclature
    /// </summary>
    public Nomenclature Nomenclature { get; set; }
    
    /// <summary>
    /// Parent item the current one is part of
    /// </summary>
    public Item Origin { get; set; }
}