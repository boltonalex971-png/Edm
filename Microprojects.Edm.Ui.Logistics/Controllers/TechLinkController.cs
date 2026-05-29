using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Contracts.ProcessDefinition;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

// Consumer-side surface for linking a Logistics Operation process to a Tech
// process. All Tech data is fetched through the ProcessDefinition contract;
// the host bridges these calls into the Technologies plugin scope.
[ApiController]
[Route("api/logistics/techlink")]
public class TechLinkController : ControllerBase
{
    private readonly IProcessDefinitionService _processDefinitions;

    public TechLinkController(IProcessDefinitionService processDefinitions)
    {
        _processDefinitions = processDefinitions;
    }

    [HttpGet("processes")]
    public Task<IReadOnlyList<TechProcessSummary>> GetProcesses(CancellationToken cancellationToken) =>
        _processDefinitions.ListProcessesAsync(cancellationToken);

    [HttpGet("processes/{id:guid}/qualifiers")]
    public Task<IReadOnlyList<TechQualifier>> GetQualifiers(Guid id, CancellationToken cancellationToken) =>
        _processDefinitions.ListQualifiersAsync(id, cancellationToken);
}
