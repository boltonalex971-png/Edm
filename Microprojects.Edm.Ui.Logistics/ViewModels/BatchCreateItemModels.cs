namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class BatchCreateItemRequest
{
    public Guid NomenclatureId { get; set; }
    public Guid TareTypeId { get; set; }

    /// <summary>
    /// Existing tare id. When null a new tare is created using <see cref="Barcode"/>.
    /// </summary>
    public Guid? TareId { get; set; }

    /// <summary>
    /// Barcode for the tare. When <see cref="TareId"/> is null a new tare with this barcode is created.
    /// </summary>
    public string? Barcode { get; set; }

    /// <summary>
    /// Number of items (or quantity for non-countable nomenclatures).
    /// Must not exceed the tare capacity / remaining slots.
    /// </summary>
    public double Quantity { get; set; }

    /// <summary>
    /// Optional supply id to link the created items to.
    /// </summary>
    public Guid? SupplyId { get; set; }
}

public class BatchCreateItemResult
{
    public int CreatedCount { get; set; }
    public double Quantity { get; set; }
    public string? Units { get; set; }
    public bool Countable { get; set; }
    public Guid TareId { get; set; }
    public string? TareBarcode { get; set; }
    public string? TareTypeName { get; set; }
    public double Remaining { get; set; }
    public IEnumerable<ItemViewModel> Items { get; set; } = [];
}

public class AllocateItemsRequest
{
    public IEnumerable<Guid> ItemIds { get; set; } = [];
}

public class AllocateItemsResult
{
    public int AllocatedCount { get; set; }
    public double AllocatedQuantity { get; set; }
    public string? Units { get; set; }
    public bool Countable { get; set; }
    public string? StoppedReason { get; set; }
}
