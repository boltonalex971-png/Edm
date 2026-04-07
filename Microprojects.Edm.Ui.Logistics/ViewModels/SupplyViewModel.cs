namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class SupplyViewModel
{
    public Guid Id { get; set; }

    public string? Barcode { get; set; }
    public string? Shipment { get; set; }
    public string? ShipmentExternalId { get; set; }

    public DateTime MetaCreated { get; set; }
}

