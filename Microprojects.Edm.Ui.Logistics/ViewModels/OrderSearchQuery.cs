namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class OrderSearchQuery
{
    public Guid? Id { get; set; }
    public Guid? NomenclatureId { get; set; }
    public bool Active { get; set; } = true;
}