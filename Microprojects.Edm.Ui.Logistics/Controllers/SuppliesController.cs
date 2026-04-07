using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class SuppliesController : CrudControllerBase<Supply, SupplyViewModel, ISupplyService>
{
    public SuppliesController(IMapper mapper, ISupplyService service, IConfiguration configuration) : base(mapper, service, configuration)
    {
    }

    [HttpGet("{id:guid}/items")]
    public async Task<IEnumerable<ItemViewModel>> GetItems(Guid id)
    {
        var items = await Service.GetItems(id);
        return Mapper.Map<IEnumerable<ItemViewModel>>(items);
    }

    [HttpPost("{id:guid}/items")]
    public async Task<ItemViewModel> AddItem(Guid id, [FromBody] ItemViewModel itemModel)
    {
        var item = Mapper.Map<Item>(itemModel);
        var created = await Service.AddItem(id, item);
        return Mapper.Map<ItemViewModel>(created);
    }

    [HttpDelete("{id:guid}/items/{itemId:guid}")]
    public async Task<bool> UnlinkItem(Guid id, Guid itemId)
    {
        await Service.UnlinkItem(id, itemId);
        return true;
    }
}

