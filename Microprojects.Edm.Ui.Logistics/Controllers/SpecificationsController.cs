using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class SpecificationsController : EntriesControllerBase<Specification, SpecificationViewModel, ISpecificationService>
{
    public SpecificationsController(ILogger<SpecificationsController> logger,
        ISpecificationService service, IDirectoryService directoryService, IConfiguration configuration) :
        base(service, directoryService, configuration)
    {
    }

    protected override SpecificationViewModel ToViewModel(Specification entry) => entry.ToViewModel();
    protected override Specification ToEntity(SpecificationViewModel model) => model.ToEntity();
}
