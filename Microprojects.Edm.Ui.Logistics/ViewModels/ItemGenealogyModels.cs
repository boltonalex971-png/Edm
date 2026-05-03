namespace Microprojects.Edm.Ui.Logistics.ViewModels;

/// <summary>
/// Bounded two-sided lineage graph for an item, walked over <c>ItemLink</c>.
/// </summary>
public class ItemGenealogy
{
    public Guid RootId { get; set; }

    public IEnumerable<ItemNode> Nodes { get; set; } = [];

    public IEnumerable<GenealogyEdge> Edges { get; set; } = [];

    /// <summary>True when the BFS stopped because the depth cap was reached on at least one side.</summary>
    public bool Truncated { get; set; }

    /// <summary>Requested depth (&lt;=0 means "whole tree" capped by a high safety limit).</summary>
    public int Depth { get; set; }
}

public class ItemNode
{
    public Guid Id { get; set; }

    public string? SerialNo { get; set; }

    public double Quantity { get; set; }

    public Guid? NomenclatureId { get; set; }
    public string? NomenclatureName { get; set; }
    public string? NomenclatureCategory { get; set; }
    public bool NomenclatureCountable { get; set; }

    /// <summary>True when this item was produced by an order's process execution (<c>ProcessId != null</c>).</summary>
    public bool IsOutput { get; set; }

    /// <summary>Set when the item came from a supply receipt — used by the genealogy pill to render a "SUPPLY" origin label.</summary>
    public Guid? SupplyId { get; set; }

    /// <summary>True when the item is a "store" creation: no supply, no producing process, no parent <c>ItemLink</c>. Mirrors <c>ItemFlags.Apply</c>.</summary>
    public bool IsStore { get; set; }

    public Guid? TareId { get; set; }
    public string? TareBarcode { get; set; }
    public string? TareTypeName { get; set; }
    public string? TareTypeUnits { get; set; }

    public int? Address { get; set; }

    public Guid? OrderId { get; set; }

    /// <summary>Signed distance from the root: &lt;0 = ancestor, 0 = root, &gt;0 = descendant.</summary>
    public int Depth { get; set; }

    /// <summary>True when the item is soft-deleted or completed — surface greyed in UI.</summary>
    public bool Inactive { get; set; }

    /// <summary>True when there are more links beyond this node that weren't returned because of the depth cap.</summary>
    public bool HasMore { get; set; }
}

public class GenealogyEdge
{
    public Guid SourceItemId { get; set; }
    public Guid TargetItemId { get; set; }
    public double ConsumedQuantity { get; set; }

    /// <summary>Null for non-execution edges (repack bulk split, allocation split).</summary>
    public Guid? OrderProcessId { get; set; }
    public string? ProcessName { get; set; }
}
