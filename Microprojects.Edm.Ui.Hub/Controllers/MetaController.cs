using System.Reflection;
using Microprojects.Edm.Plugins;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Hub.Controllers
{
    /// <summary>
    /// Surfaces the platform's product version and per-plugin ABOUT
    /// markdown so the landing page can render the active plugin's promo
    /// without modifying every plugin's own MetaController.
    /// </summary>
    [ApiController]
    [AllowAnonymous]
    [Route("api/hub/[controller]")]
    public class MetaController : ControllerBase
    {
        private static readonly Guid HubGuid = Guid.Parse(HubUiPlugin.PluginGuid);

        private readonly IPluginContainer _container;

        public MetaController(IPluginContainer container)
        {
            _container = container;
        }

        [HttpGet("version")]
        public IActionResult GetVersion()
        {
            return Ok(new { product = BuildInfo.ProductVersion });
        }

        /// <summary>The Hub's own ABOUT — the default landing promo.</summary>
        [HttpGet("about")]
        public IActionResult GetHubAbout() => GetAboutForPlugin(HubGuid);

        /// <summary>ABOUT for any loaded application plugin, by GUID.</summary>
        [HttpGet("about/{guid}")]
        public IActionResult GetAbout(Guid guid)
        {
            // Restrict to ApplicationPlugin types — we don't surface promos for
            // drivers/profiles/operations, only the plugins users pick from the Hub.
            var plugin = _container.GetAllPlugins()
                .FirstOrDefault(p =>
                    p.Guid == guid &&
                    p.GetType().GetCustomAttribute<ApplicationPluginAttribute>() is not null);

            return plugin is null ? NotFound() : GetAboutForPlugin(guid, plugin);
        }

        private IActionResult GetAboutForPlugin(Guid guid, IPlugin? plugin = null)
        {
            plugin ??= _container.GetAllPlugins().FirstOrDefault(p => p.Guid == guid);
            if (plugin is null)
            {
                return NotFound();
            }

            var assembly = plugin.GetType().Assembly;
            var resourceName = $"{assembly.GetName().Name}.ABOUT.md";
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream is null)
            {
                return NotFound();
            }
            using var reader = new StreamReader(stream);
            return Content(reader.ReadToEnd(), "text/markdown; charset=utf-8");
        }
    }
}
