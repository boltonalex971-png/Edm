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
}