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
}