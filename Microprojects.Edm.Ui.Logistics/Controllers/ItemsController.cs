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
public class ItemsController : CrudControllerBase<Item, ItemViewModel, IItemService>
{
    private readonly ILogger<ItemsController> _logger;

    public ItemsController(ILogger<ItemsController> logger, IMapper mapper,
        IItemService service, IConfiguration configuration) :
        base(mapper, service, configuration)
    {
        _logger = logger;
    }

    [HttpPost("search")]
    public async Task<IEnumerable<ItemViewModel>> Search([FromBody] ItemSearchQuery query)
    {
        var result = await Service.Search(query);
        return Mapper.Map<IEnumerable<ItemViewModel>>(result);
    }

    [HttpGet("{id:guid}/genealogy")]
    public async Task<ItemGenealogy> GetGenealogy([FromRoute] Guid id, [FromQuery] int depth = 2)
    {
        return await Service.GetGenealogy(id, depth);
    }

    [HttpGet("tare/{tareId:guid}")]
    public async Task<IEnumerable<ItemViewModel>> GetByTare([FromRoute] Guid tareId)
    {
        var items = await Service.GetByTare(tareId);
        return Mapper.Map<IEnumerable<ItemViewModel>>(items);
    }

    [HttpPost("batch")]
    public async Task<BatchCreateItemResult> BatchCreate([FromBody] BatchCreateItemRequest request)
    {
        return await Service.BatchCreate(request);
    }

    [HttpPost("repack")]
    public async Task<RepackResult> Repack([FromBody] RepackRequest request)
    {
        return await Service.Repack(request);
    }
}