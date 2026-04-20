namespace Microprojects.Edm.Ui.Logistics.Models;

/// <summary>
/// Persists consumption links between input items and produced target items during
/// <see cref="OrderProcess"/> execution.
/// </summary>
public class ItemLink : DomainObject
{
    /// <summary>
    /// Owning order process for execution-time links (<see cref="OrderService.Execute"/>).
    /// Null for non-execution lineage edges such as repack bulk splits or
    /// allocation splits that create a child item from an unfinished parent.
    /// </summary>
    public Guid? OrderProcessId { get; set; }
    public OrderProcess? OrderProcess { get; set; }

    public Guid SourceItemId { get; set; }
    public Item SourceItem { get; set; } = null!;

    public Guid TargetItemId { get; set; }
    public Item TargetItem { get; set; } = null!;

    public double ConsumedQuantity { get; set; }
}

