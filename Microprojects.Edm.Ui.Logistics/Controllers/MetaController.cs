using System.Diagnostics;
using System.Reflection;
using Microprojects.Edm.Plugins;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/logistics/[controller]")]
public class MetaController : ControllerBase
{
    private static readonly Assembly PluginAssembly = typeof(LogisticsUiPlugin).Assembly;

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
        // PluginResource resolves CHANGES.{lng}.md → CHANGES.md based on
        // the request's CurrentUICulture (set by UseRequestLocalization).
        var content = PluginResource.ReadLocalized(PluginAssembly, "CHANGES");
        return content == null
            ? NotFound()
            : Content(content, "text/markdown; charset=utf-8");
    }
}
