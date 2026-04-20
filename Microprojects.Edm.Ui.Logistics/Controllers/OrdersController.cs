using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Optosense.Edm.Core.AspNet.Controllers;
using Optosense.Edm.Plugins;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class OrdersController : CrudControllerBase<Order, OrderViewModel, IOrderService>
{
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(ILogger<OrdersController> logger, IMapper mapper,
        IOrderService service, IConfiguration configuration) :
        base(mapper, service, configuration)
    {
        _logger = logger;
    }

    [HttpGet("{id:Guid}/specification")]
    public async Task<IEnumerable<OrderSpecificationViewModel>> GetSpecification(Guid id)
    {
        var items = await Service.GetSpecifications(id);
        return Mapper.Map<IEnumerable<OrderSpecificationViewModel>>(items);
    }

    [HttpGet("{id:Guid}/items")]
    public async Task<IEnumerable<ItemViewModel>> GetItems(Guid id)
    {
        var items = await Service.GetItems(id);
        return Mapper.Map<IEnumerable<ItemViewModel>>(items);
    }
    
    [HttpPost("{id:Guid}/items")]
    public async Task<ItemViewModel> AddItem(Guid id, [FromBody]  ItemViewModel itemModel)
    {
        var item = Mapper.Map<Item>(itemModel);
        var orderItem = await Service.AddItem(id, item);
        return Mapper.Map<ItemViewModel>(orderItem);
    }

    [HttpPost("{id:Guid}/items/batch")]
    public async Task<AllocateItemsResult> AddItems(Guid id, [FromBody] AllocateItemsRequest request)
    {
        return await Service.AddItems(id, request.ItemIds);
    }
    
    [HttpGet("{id:Guid}/operations")]
    public async Task<IEnumerable<OrderProcessViewModel>> GetOrderProcesses(Guid id)
    {
        var items = await Service.GetOrderProcesses(id);
        return Mapper.Map<IEnumerable<OrderProcessViewModel>>(items);
    }

    /// <summary>
    /// Execute the order's (single) process. Returns completion state and the
    /// number of outputs awaiting tare allocation.
    /// </summary>
    [HttpPost("{id:Guid}/execute")]
    public async Task<ExecuteResult> Execute(Guid id)
    {
        return await Service.Execute(id);
    }

    /// <summary>
    /// Returns the items produced by the order's execution, split into
    /// <c>allocated</c> (already placed into a tare) and <c>unallocated</c>.
    /// </summary>
    [HttpGet("{id:Guid}/output-items")]
    public async Task<OrderOutputItems> GetOutputItems(Guid id)
    {
        return await Service.GetOutputItems(id);
    }

    /// <summary>
    /// Batch-assign outputs of the order to selected tares.
    /// </summary>
    [HttpPost("{id:Guid}/allocate-outputs")]
    public async Task<AllocateOutputsResult> AllocateOutputs(Guid id, [FromBody] AllocateOutputsRequest request)
    {
        return await Service.AllocateOutputs(id, request.Allocations);
    }

    /// <summary>
    /// Batch-assign a process grade (or clear it) on the selected output items.
    /// Items already placed in a tare are rejected — grade is locked after allocation.
    /// </summary>
    [HttpPost("{id:Guid}/assign-grades")]
    public async Task<AssignGradesResult> AssignGrades(Guid id, [FromBody] AssignGradesRequest request)
    {
        return await Service.AssignGrades(id, request);
    }

    /// <summary>
    /// Marks the order as completed. Fails if any output is still unallocated.
    /// </summary>
    [HttpPost("{id:Guid}/complete")]
    public async Task<IActionResult> Complete(Guid id)
    {
        await Service.CompleteOrder(id);
        return Ok();
    }

    [HttpPost("search")]
    public async Task<IEnumerable<OrderViewModel>> Search([FromBody] OrderSearchQuery query)
    {
        var result = await Service.Search(query);
        return Mapper.Map<IEnumerable<OrderViewModel>>(result);
    }
}
