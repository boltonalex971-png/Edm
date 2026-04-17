namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class ItemViewModel
{
    public Guid Id { get; set; }
    public Guid? OriginId { get; set; }
    
    public Guid? SupplyId { get; set; }
    public string? SerialNo { get; set; }   
    public double Quantity { get; set; }
    public Guid NomenclatureId { get; set; }
    public string? NomenclatureName { get; set; }
    public string? NomenclatureDescription { get; set; }
    public string? NomenclatureCategory { get; set; }
    public Guid? TareId { get; set; }
    public string? TareBarcode { get; set; }
    public Guid? TareTareTypeId { get; set; }
    public string? TareTareTypeName { get; set; }
    public string? TareTareTypeUnits { get; set; }
    public int? TareTareTypeSizeX { get; set; }
    public int? TareTareTypeSizeY { get; set; }
    public int? TareTareTypeSizeZ { get; set; }
    public int TareTareTypeDimensions { get; set; }
    public double TareTareTypeCapacity { get; set; }
    public int? Address { get; set; }
    public DateTime MetaCreated { get; set; }
}