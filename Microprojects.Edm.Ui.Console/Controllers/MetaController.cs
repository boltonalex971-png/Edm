using System.Diagnostics;
using System.Reflection;
using Microprojects.Edm.Plugins;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Console.Controllers
{
    [ApiController]
    [AllowAnonymous]
    [Route("api/console/[controller]")]
    public class MetaController : ControllerBase
    {
        private static readonly Assembly PluginAssembly = typeof(HostConsolePlugin).Assembly;

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
            return content is null
                ? NotFound()
                : Content(content, "text/markdown; charset=utf-8");
        }
    }
}
