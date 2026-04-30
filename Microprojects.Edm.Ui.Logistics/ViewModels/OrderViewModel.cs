namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public enum OrderStatus
{
    Draft,
    Running,
    OutputsPending,
    Completed,
}

public class OrderViewModel
{
    public Guid Id { get; set; }
    public string? Number { get; set; }
    public Guid? ProcessId { get; set; }
    public string? ProcessName { get; set; }
    public Guid? ProcessNomenclatureId { get; set; }
    public string? ProcessNomenclatureName { get; set; }
    public string? Description { get; set; }
    public double? Amount { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    /// <summary>When the order reached end-of-life (all outputs allocated and accepted).</summary>
    public DateTime? Completed { get; set; }
    /// <summary>When the order was cancelled/removed by the user.</summary>
    public DateTime? Deleted { get; set; }
    /// <summary>Derived lifecycle state of the order's single root process.</summary>
    public OrderStatus Status { get; set; }
    /// <summary>Name of the user currently responsible for executing the order. Null when unlaunched.</summary>
    public string? Executor { get; set; }
    /// <summary>True when the current user is the Executor of this order.</summary>
    public bool Mine { get; set; }
}
