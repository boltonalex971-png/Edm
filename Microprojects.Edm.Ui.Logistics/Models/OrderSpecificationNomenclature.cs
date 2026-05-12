using System.ComponentModel.DataAnnotations.Schema;

namespace Microprojects.Edm.Ui.Logistics.Models;

/// <summary>
/// Immutable snapshot of one <see cref="SpecificationNomenclature"/> row,
/// copied into the order at creation time. The (Nomenclature, Quantity, Process)
/// triple is frozen so subsequent edits or auto-fork versioning of the
/// underlying process spec or nomenclature have no effect on this order's
/// specification view.
/// </summary>
public class OrderSpecificationNomenclature : DomainObject
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; }

    public Guid NomenclatureId { get; set; }
    public Nomenclature Nomenclature { get; set; }

    /// <summary>
    /// Denormalised copy of <see cref="Order.ProcessId"/> at the moment the
    /// snapshot row was created. Carried so the viewmodel can surface
    /// `ProcessId`/`ProcessName` without a separate join on `Order.Process`,
    /// and to make the snapshot self-describing.
    /// </summary>
    public Guid ProcessId { get; set; }
    public Process Process { get; set; }

    public double Quantity { get; set; }

    /// <summary>
    /// Convenience product of <see cref="Quantity"/> and the owning order's
    /// <see cref="Order.Amount"/>. Runtime-only — requires the
    /// <see cref="Order"/> navigation to be loaded.
    /// </summary>
    [NotMapped]
    public double Amount => Quantity * (Order?.Amount ?? 0);

    /// <summary>
    /// Quantity allocated against this spec row — populated by
    /// <c>OrderService.GetSpecifications</c> from live item / item-link data.
    /// Not persisted.
    /// </summary>
    [NotMapped]
    public double Total { get; set; }

    /// <summary>
    /// Items currently allocated against this spec row's nomenclature, set by
    /// <c>OrderService.GetSpecifications</c> from live item data. Not persisted.
    /// </summary>
    [NotMapped]
    public ICollection<Item> Items { get; set; } = new List<Item>();
}
