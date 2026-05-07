using System.Diagnostics;
using System.IO;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Ui.Technologies;

namespace Microprojects.Edm.Ui.Technologies.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/technologies/[controller]")]
public class MetaController : ControllerBase
{
    private static readonly Assembly PluginAssembly = typeof(TechnologiesUiPlugin).Assembly;
    private const string ChangelogResourceName = "Microprojects.Edm.Ui.Technologies.CHANGES.md";

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
        using var stream = PluginAssembly.GetManifestResourceStream(ChangelogResourceName);
        if (stream == null)
        {
            return NotFound();
        }
        using var reader = new StreamReader(stream);
        return Content(reader.ReadToEnd(), "text/markdown; charset=utf-8");
    }
}
