namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class TareViewModel
{
    public Guid Id { get; set; }
    public string? Barcode { get; set; }
    public Guid TareTypeId { get; set; }
    public string? TareTypeName { get; set; }
    public string? TareTypeUnits { get; set; }
    public int? SizeX { get; set; }
    public int? SizeY { get; set; }
    public int? SizeZ { get; set; }
    public int Dimensions { get; set; }
    public double Capacity { get; set; }
}

public class AvailableTareViewModel : TareViewModel
{
    public double Remaining { get; set; }
}

public class CreateTareRequest
{
    public string? Barcode { get; set; }
    public Guid TareTypeId { get; set; }
}
