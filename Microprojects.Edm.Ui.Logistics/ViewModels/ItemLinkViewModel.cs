namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class ItemLinkViewModel
{
    public Guid Id { get; set; }

    public Guid OrderProcessId { get; set; }

    public Guid SourceItemId { get; set; }
    public string? SourceSerialNo { get; set; }
    public string? SourceNomenclatureName { get; set; }
    public string? SourceTareBarcode { get; set; }
    public string? SourceTareTypeName { get; set; }
    public string? SourceTareTypeUnits { get; set; }
    public int? SourceAddress { get; set; }

    public Guid TargetItemId { get; set; }
    public string? TargetNomenclatureName { get; set; }
    public string? TargetTareBarcode { get; set; }
    public int? TargetAddress { get; set; }

    public double ConsumedQuantity { get; set; }
}

