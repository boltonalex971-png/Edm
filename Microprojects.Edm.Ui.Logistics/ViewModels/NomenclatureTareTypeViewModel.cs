namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class NomenclatureTareTypeViewModel
{
    public Guid Id { get; set; }
    public Guid NomenclatureId { get; set; }
    public Guid TareTypeId { get; set; }
    public string? TareTypeName { get; set; }
    public string? TareTypeDescription { get; set; }
    public string? NomenclatureName { get; set; }
    public string? NomenclatureDescription { get; set; }
    public string? NomenclatureCategory { get; set; }
    public bool IsDefault { get; set; }
}
