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
public class NomenclaturesController : EntriesControllerBase<Nomenclature, NomenclatureViewModel, INomenclatureService>
{
    public NomenclaturesController(ILogger<NomenclaturesController> logger, IMapper mapper,
        INomenclatureService service, IDirectoryService directoryService, IConfiguration configuration) :
        base(mapper, service, directoryService, configuration)
    {
    }

    [HttpGet("categories")]
    public string[] GetCategories() => Enum.GetNames(typeof(NomenclatureCategories));

    [HttpGet("{id:guid}/taretypes")]
    public async Task<IEnumerable<NomenclatureTareTypeViewModel>> GetAllowedTareTypes(Guid id)
    {
        var rows = await Service.GetAllowedTareTypes(id);
        return Mapper.Map<IEnumerable<NomenclatureTareTypeViewModel>>(rows);
    }

    [HttpPost("{id:guid}/taretypes")]
    public async Task<NomenclatureTareTypeViewModel> AddAllowedTareType(Guid id, [FromBody] NomenclatureTareTypeViewModel model)
    {
        var row = await Service.AddAllowedTareType(id, model.TareTypeId, model.IsDefault);
        return Mapper.Map<NomenclatureTareTypeViewModel>(row);
    }

    [HttpPut("{id:guid}/taretypes")]
    public async Task<NomenclatureTareTypeViewModel> SaveAllowedTareType(Guid id, [FromBody] NomenclatureTareTypeViewModel model)
    {
        var row = await Service.SetAllowedTareTypeDefault(id, model.Id, model.IsDefault);
        return Mapper.Map<NomenclatureTareTypeViewModel>(row);
    }

    [HttpDelete("{id:guid}/taretypes/{rowId:guid}")]
    public Task<bool> RemoveAllowedTareType(Guid id, Guid rowId) => Service.RemoveAllowedTareType(id, rowId);
}
