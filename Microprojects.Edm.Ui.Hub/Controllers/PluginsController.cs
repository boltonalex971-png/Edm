using System.Reflection;
using Microprojects.Edm.Plugins;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Hub.Controllers
{
    /// <summary>
    /// Returns the loaded application plugins so the Hub landing page
    /// can render one tile per plugin. The Hub itself is filtered out
    /// by GUID so it does not appear among its own tiles.
    /// </summary>
    [ApiController]
    [Route("api/hub/[controller]")]
    public class PluginsController : ControllerBase
    {
        private static readonly Guid HubGuid = Guid.Parse(HubUiPlugin.PluginGuid);

        private readonly IPluginContainer _container;

        public PluginsController(IPluginContainer container)
        {
            _container = container;
        }

        [HttpGet]
        public IActionResult Get()
        {
            var plugins = _container.GetAllPlugins()
                .Where(p => p.GetType().GetCustomAttribute<ApplicationPluginAttribute>() is not null)
                .Where(p => p.Guid != HubGuid)
                .Select(p => new
                {
                    guid = p.Guid,
                    name = p.Name,
                    description = p.Description,
                    homepage = p.Homepage
                });

            return Ok(plugins);
        }

        [HttpGet("version")]
        public IActionResult GetVersion()
        {
            return Ok(new { productVersion = BuildInfo.ProductVersion });
        }
    }
}
