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
    
    [HttpGet("{id:Guid}/operations")]
    public async Task<IEnumerable<OrderProcessViewModel>> GetOrderProcesses(Guid id)
    {
        var items = await Service.GetOrderProcesses(id);
        return Mapper.Map<IEnumerable<OrderProcessViewModel>>(items);
    }
}