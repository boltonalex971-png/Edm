namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class ItemViewModel
{
    public Guid Id { get; set; }

    public string? SerialNo { get; set; }
    public double Quantity { get; set; }
    public Guid NomenclatureId { get; set; }
    public string? NomenclatureName { get; set; }
    public string? NomenclatureDescription { get; set; }
    public string? NomenclatureCategory { get; set; }
    public bool NomenclatureCountable { get; set; }
    /// <summary>Units label, sourced from nomenclature's default tare type.</summary>
    public string? NomenclatureUnits { get; set; }
    public Guid? TareId { get; set; }
    public string? TareBarcode { get; set; }
    public Guid? TareTareTypeId { get; set; }
    public string? TareTareTypeName { get; set; }
    public string? TareTareTypeUnits { get; set; }
    public int? TareTareTypeSizeX { get; set; }
    public int? TareTareTypeSizeY { get; set; }
    public int? TareTareTypeSizeZ { get; set; }
    public int TareTareTypeDimensions { get; set; }
    public double TareTareTypeCapacity { get; set; }
    public int? Address { get; set; }
    public DateTime MetaCreated { get; set; }

    /// <summary>Supply the item was received with (incoming / warehouse items).</summary>
    public Guid? SupplyId { get; set; }
    /// <summary>Display label for the supply — shipment name falling back to barcode.</summary>
    public string? SupplyName { get; set; }

    /// <summary>Order this item was produced for (outputs) or assigned to (inputs).</summary>
    public Guid? OrderId { get; set; }
    /// <summary>Display label for the order — uses process name falling back to description.</summary>
    public string? OrderName { get; set; }
    /// <summary>Free-form order number (Order.Number).</summary>
    public string? OrderNumber { get; set; }

    /// <summary>Process that produced this item (set for execution outputs).</summary>
    public Guid? ProcessId { get; set; }
    /// <summary>Display label for the process — DirectoryEntry.Name.</summary>
    public string? ProcessName { get; set; }

    /// <summary>Process grade assigned to this output item (nullable).</summary>
    public Guid? GradeId { get; set; }
    /// <summary>Display label for the grade — Grade.Name.</summary>
    public string? GradeName { get; set; }

    /// <summary>
    /// True when this item is an order execution output (produced by a process),
    /// i.e. <c>ProcessId != null</c>. Useful for UI to distinguish output stock
    /// from supply-only stock without relying on field combinations.
    /// </summary>
    public bool IsOutput { get; set; }

    /// <summary>
    /// True when this item has no recorded origin: no <see cref="SupplyId"/>,
    /// no producing process, and no parent <c>ItemLink</c>. Such items were
    /// created directly via batch entry and are presumed to come from store.
    /// </summary>
    public bool IsStore { get; set; }

    /// <summary>
    /// Soft-deleted or naturally completed (e.g. consumed by an order
    /// execution). Mirrors the same flag on <c>ItemNode</c> so historical
    /// item rows can be rendered greyed.
    /// </summary>
    public bool Inactive { get; set; }
}