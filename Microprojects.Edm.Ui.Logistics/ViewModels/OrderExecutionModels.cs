namespace Microprojects.Edm.Ui.Logistics.ViewModels;

/// <summary>
/// Result of <c>POST orders/{id}/execute</c>. The order is marked completed only when
/// no pending outputs (items without a tare) remain; otherwise the client should
/// navigate to the Allocate Process Output page.
/// </summary>
public class ExecuteResult
{
    public bool Completed { get; set; }
    public int PendingCount { get; set; }
}

/// <summary>
/// Response for <c>GET orders/{id}/output-items</c>. Splits items produced by the
/// order's execution into already-tared (allocated) and still-untared (unallocated).
/// </summary>
public class OrderOutputItems
{
    /// <summary>Root process of the order — used by UI to load applicable grades.</summary>
    public Guid? ProcessId { get; set; }
    public IEnumerable<ItemViewModel> Allocated { get; set; } = [];
    public IEnumerable<ItemViewModel> Unallocated { get; set; } = [];
}

/// <summary>
/// Batch-assign <see cref="GradeId"/> (null = clear) to unallocated output items.
/// Items already in a tare are rejected.
/// </summary>
public class AssignGradesRequest
{
    public Guid? GradeId { get; set; }
    public Guid[] ItemIds { get; set; } = [];
}

public class AssignGradesResult
{
    public int UpdatedCount { get; set; }
    public string[] Errors { get; set; } = [];
}

/// <summary>
/// One item -> tare assignment issued from the Allocate page. <see cref="Address"/>
/// is optional and only meaningful for addressed tares.
/// </summary>
public class OutputAllocation
{
    public Guid ItemId { get; set; }
    public Guid TareId { get; set; }
    public int? Address { get; set; }
}

public class AllocateOutputsRequest
{
    public OutputAllocation[] Allocations { get; set; } = [];
}

public class AllocateOutputsResult
{
    public int AllocatedCount { get; set; }
    public string[] Errors { get; set; } = [];
}
