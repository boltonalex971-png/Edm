namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class OrderSpecificationNomenclatureViewModel
{
    public Guid Id { get; set; }
    public Guid NomenclatureId { get; set; }
    public string NomenclatureCategory { get; set; }
    public string NomenclatureName { get; set; }
    public string NomenclatureDescription { get; set; }
    public bool NomenclatureCountable { get; set; }
    public string ProcessName { get; set; }
    public Guid ProcessId { get; set; }
    public double Amount { get; set; }
    public double Total { get; set; }
}