using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Contracts.ProcessDefinition;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
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
    private readonly ITechLinkService _techLink;

    public TechLinkController(IProcessDefinitionService processDefinitions, ITechLinkService techLink)
    {
        _processDefinitions = processDefinitions;
        _techLink = techLink;
    }

    [HttpGet("processes")]
    public Task<IReadOnlyList<TechProcessSummary>> GetProcesses(CancellationToken cancellationToken) =>
        _processDefinitions.ListProcessesAsync(cancellationToken);

    [HttpGet("processes/{id:guid}/qualifiers")]
    public Task<IReadOnlyList<TechQualifier>> GetQualifiers(Guid id, CancellationToken cancellationToken) =>
        _processDefinitions.ListQualifiersAsync(id, cancellationToken);

    // Links a Tech process as an ordered step of the given Technology process.
    [HttpPost("processes/{technologyProcessId:guid}/link")]
    public async Task<IActionResult> Link(Guid technologyProcessId, [FromBody] LinkTechStepRequest body)
    {
        await _techLink.LinkTechStep(technologyProcessId, body.TechProcessId, body.Mode, body.Order);
        return Ok();
    }

    public sealed record LinkTechStepRequest(Guid TechProcessId, ProcessMode? Mode, int Order);
}
