using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
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
    private readonly LogisticsContext _db;

    public ItemsController(ILogger<ItemsController> logger, IMapper mapper,
        IItemService service, LogisticsContext db, IConfiguration configuration) :
        base(mapper, service, configuration)
    {
        _logger = logger;
        _db = db;
    }

    public override async Task<ItemViewModel> GetObjectById(Guid id)
    {
        var dto = await base.GetObjectById(id);
        if (dto != null)
        {
            await ItemFlags.Apply(_db, dto);
        }
        return dto;
    }

    [HttpPost("search")]
    public async Task<IEnumerable<ItemViewModel>> Search([FromBody] ItemSearchQuery query)
    {
        var result = await Service.Search(query);
        var dtos = Mapper.Map<List<ItemViewModel>>(result);
        await ItemFlags.Apply(_db, dtos);
        return dtos;
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
        var dtos = Mapper.Map<List<ItemViewModel>>(items);
        await ItemFlags.Apply(_db, dtos);
        return dtos;
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
