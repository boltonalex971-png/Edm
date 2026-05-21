using System.Diagnostics;
using System.Reflection;
using Microprojects.Edm.Plugins;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Technologies.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/technologies/[controller]")]
public class MetaController : ControllerBase
{
    private static readonly Assembly PluginAssembly = typeof(TechnologiesUiPlugin).Assembly;

    [HttpGet("version")]
    public IActionResult GetVersion()
    {
        var fileVersion = FileVersionInfo.GetVersionInfo(PluginAssembly.Location).FileVersion ?? "0.0.0.0";
        return Ok(new
        {
            main = fileVersion,
            product = BuildInfo.ProductVersion,
        });
    }

    [HttpGet("changelog")]
    public IActionResult GetChangelog()
    {
        var content = PluginResource.ReadLocalized(PluginAssembly, "CHANGES");
        return content == null
            ? NotFound()
            : Content(content, "text/markdown; charset=utf-8");
    }
}
