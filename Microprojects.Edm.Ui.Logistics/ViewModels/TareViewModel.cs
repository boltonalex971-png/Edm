namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class TareViewModel
{
    public Guid Id { get; set; }
    public string? Barcode { get; set; }
    public Guid TareTypeId { get; set; }
    public string? TareTypeName { get; set; }
}