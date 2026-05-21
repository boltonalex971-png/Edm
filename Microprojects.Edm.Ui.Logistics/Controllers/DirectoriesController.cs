using Microprojects.Edm.Cache;
using Microprojects.Edm.Shared.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

// Thin route-bearing subclass. All endpoints live in the shared base.
[Route("api/logistics/[controller]")]
public class DirectoriesController : Microprojects.Edm.Shared.Controllers.DirectoriesController
{
    public DirectoriesController(ICache cache, IDirectoryService directoryService,
        IDirectoryRootRegistry roots, IConfiguration configuration)
        : base(cache, directoryService, roots, configuration)
    {
    }
}
