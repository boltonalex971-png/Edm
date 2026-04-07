namespace Microprojects.Edm.Ui.Logistics.Models;

/// <summary>
/// Persists consumption links between input items and produced target items during
/// <see cref="OrderProcess"/> execution.
/// </summary>
public class ItemLink : DomainObject
{
    public Guid OrderProcessId { get; set; }
    public OrderProcess OrderProcess { get; set; } = null!;

    public Guid SourceItemId { get; set; }
    public Item SourceItem { get; set; } = null!;

    public Guid TargetItemId { get; set; }
    public Item TargetItem { get; set; } = null!;

    public double ConsumedQuantity { get; set; }
}

