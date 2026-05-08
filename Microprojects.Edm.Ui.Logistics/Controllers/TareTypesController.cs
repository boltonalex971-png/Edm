using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class TareTypesController : EntriesControllerBase<TareType, TareTypeViewModel, ITareTypeService>
{
    public TareTypesController(ILogger<TareTypesController> logger,
        ITareTypeService service, IDirectoryService directoryService, IConfiguration configuration) :
        base(service, directoryService, configuration)
    {
    }

    protected override TareTypeViewModel ToViewModel(TareType entry) => entry.ToViewModel();
    protected override TareType ToEntity(TareTypeViewModel model) => model.ToEntity();

    [HttpGet("{id:guid}/nomenclatures")]
    public async Task<IEnumerable<NomenclatureTareTypeViewModel>> GetAllowedNomenclatures(Guid id)
    {
        var rows = await Service.GetAllowedNomenclatures(id);
        return rows.Select(r => r.ToViewModel()).ToList();
    }

    [HttpPost("{id:guid}/nomenclatures")]
    public async Task<NomenclatureTareTypeViewModel> AddAllowedNomenclature(Guid id, [FromBody] NomenclatureTareTypeViewModel model)
    {
        var row = await Service.AddAllowedNomenclature(id, model.NomenclatureId);
        return row.ToViewModel();
    }

    // PUT exists for grid edit-mode round-trip; IsDefault is read-only on this side and is not honored.
    [HttpPut("{id:guid}/nomenclatures")]
    public async Task<NomenclatureTareTypeViewModel> SaveAllowedNomenclature(Guid id, [FromBody] NomenclatureTareTypeViewModel model)
    {
        var rows = await Service.GetAllowedNomenclatures(id);
        var row = rows.FirstOrDefault(r => r.Id == model.Id)
            ?? throw new EdmException("Allowed-nomenclature row not found.");
        return row.ToViewModel();
    }

    [HttpDelete("{id:guid}/nomenclatures/{rowId:guid}")]
    public Task<bool> RemoveAllowedNomenclature(Guid id, Guid rowId) => Service.RemoveAllowedNomenclature(id, rowId);
}
