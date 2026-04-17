namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class RepackMove
{
    public Guid SourceItemId { get; set; }
    public Guid TargetTareId { get; set; }
    public int? TargetAddress { get; set; }
    public double Quantity { get; set; }
}

public class RepackRequest
{
    public Guid NomenclatureId { get; set; }
    public RepackMove[] Moves { get; set; } = [];
}

public class RepackResult
{
    public int MovedCount { get; set; }
    public string[] Errors { get; set; } = [];
}
