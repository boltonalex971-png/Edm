namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class ItemViewModel
{
    public Guid Id { get; set; }
    public Guid? OriginId { get; set; }
    
    public string? Shipment { get; set; }
    public string? ShipmentExternalId { get; set; }
    public string? SerialNo { get; set; }   
    public int Quantity { get; set; }
    public Guid NomenclatureId { get; set; }
    public string? NomenclatureName { get; set; }
    public Guid TareId { get; set; }
    public string? TareBarcode { get; set; }
    public Guid TareTareTypeId { get; set; }
    public string? TareTareTypeName { get; set; }
    public string? TareTareTypeUnit { get; set; }
    public DateTime MetaCreated { get; set; }
}