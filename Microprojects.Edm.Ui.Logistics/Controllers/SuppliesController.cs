using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class SuppliesController : CrudControllerBase<Supply, SupplyViewModel, ISupplyService>
{
    public SuppliesController(ISupplyService service, IConfiguration configuration) : base(service, configuration)
    {
    }

    protected override SupplyViewModel ToViewModel(Supply entry) => entry.ToViewModel();
    protected override Supply ToEntity(SupplyViewModel model) => model.ToEntity();

    [HttpPost("search")]
    public async Task<IEnumerable<SupplyViewModel>> Search([FromBody] SupplySearchQuery query)
    {
        var result = await Service.Search(query);
        return result.Select(s => s.ToViewModel()).ToList();
    }

    [HttpGet("{id:guid}/items")]
    public async Task<IEnumerable<ItemViewModel>> GetItems(Guid id)
    {
        var items = await Service.GetItems(id);
        return items.Select(i => i.ToViewModel()).ToList();
    }

    [HttpPost("{id:guid}/items")]
    public async Task<ItemViewModel> AddItem(Guid id, [FromBody] ItemViewModel itemModel)
    {
        var item = itemModel.ToEntity();
        var created = await Service.AddItem(id, item);
        return created.ToViewModel();
    }

    [HttpDelete("{id:guid}/items/{itemId:guid}")]
    public async Task<bool> UnlinkItem(Guid id, Guid itemId)
    {
        await Service.UnlinkItem(id, itemId);
        return true;
    }
}
