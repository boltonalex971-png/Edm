using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Auth;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class OrdersController : CrudControllerBase<Order, OrderViewModel, IOrderService>
{
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(ILogger<OrdersController> logger,
        IOrderService service, IConfiguration configuration) :
        base(service, configuration)
    {
        _logger = logger;
    }

    protected override OrderViewModel ToViewModel(Order entry) => entry.ToViewModel();
    protected override Order ToEntity(OrderViewModel model) => model.ToEntity();

    [RequireRoles("Operator", "Technologist", "Admin")]
    public override async Task<OrderViewModel> GetObjectById(Guid id)
    {
        if (id == Guid.Empty)
        {
            return new OrderViewModel { Number = await Service.GetNextNumber() };
        }

        var entry = await Service.Get(id);
        if (entry == null)
        {
            return new OrderViewModel();
        }

        var model = entry.ToViewModel();
        var states = await Service.GetExecutionStates(new[] { id });
        if (states.TryGetValue(id, out var state))
        {
            model.Status = state.Status;
            model.Executor = state.Executor ?? model.Executor;
            model.Mine = state.Mine;
        }
        return model;
    }

    [HttpGet("{id:Guid}/specification")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<IEnumerable<OrderSpecificationNomenclatureViewModel>> GetSpecification(Guid id)
    {
        var items = await Service.GetSpecifications(id);
        return items.Select(i => i.ToViewModel()).ToList();
    }

    [HttpGet("{id:Guid}/items")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<IEnumerable<ItemViewModel>> GetItems(Guid id)
    {
        var items = await Service.GetItems(id);
        return items.Select(i => i.ToViewModel()).ToList();
    }

    [HttpPost("{id:Guid}/items")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<ItemViewModel> AddItem(Guid id, [FromBody] ItemViewModel itemModel)
    {
        var item = itemModel.ToEntity();
        var orderItem = await Service.AddItem(id, item);
        return orderItem.ToViewModel();
    }

    [HttpPost("{id:Guid}/items/batch")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<AllocateItemsResult> AddItems(Guid id, [FromBody] AllocateItemsRequest request)
    {
        return await Service.AddItems(id, request.ItemIds);
    }

    [HttpGet("{id:Guid}/operations")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<IEnumerable<OrderProcessViewModel>> GetOrderProcesses(Guid id)
    {
        var items = await Service.GetOrderProcesses(id);
        return items.Select(i => i.ToViewModel()).ToList();
    }

    /// <summary>
    /// Execute the order's (single) process. Returns completion state and the
    /// number of outputs awaiting tare allocation.
    /// </summary>
    [HttpPost("{id:Guid}/execute")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<ExecuteResult> Execute(Guid id)
    {
        return await Service.Execute(id);
    }

    /// <summary>
    /// Returns the items produced by the order's execution, split into
    /// <c>allocated</c> (already placed into a tare) and <c>unallocated</c>.
    /// </summary>
    [HttpGet("{id:Guid}/output-items")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<OrderOutputItems> GetOutputItems(Guid id)
    {
        return await Service.GetOutputItems(id);
    }

    /// <summary>
    /// Batch-assign outputs of the order to selected tares.
    /// </summary>
    [HttpPost("{id:Guid}/allocate-outputs")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<AllocateOutputsResult> AllocateOutputs(Guid id, [FromBody] AllocateOutputsRequest request)
    {
        return await Service.AllocateOutputs(id, request.Allocations);
    }

    /// <summary>
    /// Batch-assign a process grade (or clear it) on the selected output items.
    /// Items already placed in a tare are rejected — grade is locked after allocation.
    /// </summary>
    [HttpPost("{id:Guid}/assign-grades")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<AssignGradesResult> AssignGrades(Guid id, [FromBody] AssignGradesRequest request)
    {
        return await Service.AssignGrades(id, request);
    }

    /// <summary>
    /// Marks the order as completed. Fails if any output is still unallocated.
    /// </summary>
    [HttpPost("{id:Guid}/complete")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<IActionResult> Complete(Guid id)
    {
        await Service.CompleteOrder(id);
        return Ok();
    }

    [HttpGet("next-number")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<string> GetNextNumber()
    {
        return await Service.GetNextNumber();
    }

    [HttpPost("search")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<IEnumerable<OrderViewModel>> Search([FromBody] OrderSearchQuery query)
    {
        var result = (await Service.Search(query)).ToList();
        var viewModels = result.Select(o => o.ToViewModel()).ToList();
        var states = await Service.GetExecutionStates(result.Select(o => o.Id));
        foreach (var vm in viewModels)
        {
            if (states.TryGetValue(vm.Id, out var state))
            {
                vm.Status = state.Status;
                vm.Executor = state.Executor ?? vm.Executor;
                vm.Mine = state.Mine;
            }
        }
        return viewModels;
    }
}
