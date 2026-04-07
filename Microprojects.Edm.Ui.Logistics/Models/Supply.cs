namespace Microprojects.Edm.Ui.Logistics.Models;

public class Supply : DomainObject, IWithMeta
{
    public string? Barcode { get; set; }

    /// <summary>
    /// Name of shipment for incoming items.
    /// </summary>
    public string? Shipment { get; set; }

    /// <summary>
    /// Shipment external id for integration with accounting system.
    /// </summary>
    public string? ShipmentExternalId { get; set; }

    public ICollection<Item> Items { get; set; } = new List<Item>();

    public Meta Meta { get; set; }
}
