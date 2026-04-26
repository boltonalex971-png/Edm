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
public class TareTypesController : EntriesControllerBase<TareType, TareTypeViewModel, ITareTypeService>
{
    public TareTypesController(ILogger<TareTypesController> logger, IMapper mapper,
        ITareTypeService service, IDirectoryService directoryService, IConfiguration configuration) :
        base(mapper, service, directoryService, configuration)
    {
    }

    [HttpGet("{id:guid}/nomenclatures")]
    public async Task<IEnumerable<NomenclatureTareTypeViewModel>> GetAllowedNomenclatures(Guid id)
    {
        var rows = await Service.GetAllowedNomenclatures(id);
        return Mapper.Map<IEnumerable<NomenclatureTareTypeViewModel>>(rows);
    }

    [HttpPost("{id:guid}/nomenclatures")]
    public async Task<NomenclatureTareTypeViewModel> AddAllowedNomenclature(Guid id, [FromBody] NomenclatureTareTypeViewModel model)
    {
        var row = await Service.AddAllowedNomenclature(id, model.NomenclatureId);
        return Mapper.Map<NomenclatureTareTypeViewModel>(row);
    }

    // PUT exists for grid edit-mode round-trip; IsDefault is read-only on this side and is not honored.
    [HttpPut("{id:guid}/nomenclatures")]
    public async Task<NomenclatureTareTypeViewModel> SaveAllowedNomenclature(Guid id, [FromBody] NomenclatureTareTypeViewModel model)
    {
        var rows = await Service.GetAllowedNomenclatures(id);
        var row = rows.FirstOrDefault(r => r.Id == model.Id)
            ?? throw new EdmException("Allowed-nomenclature row not found.");
        return Mapper.Map<NomenclatureTareTypeViewModel>(row);
    }

    [HttpDelete("{id:guid}/nomenclatures/{rowId:guid}")]
    public Task<bool> RemoveAllowedNomenclature(Guid id, Guid rowId) => Service.RemoveAllowedNomenclature(id, rowId);
}
