using System.Diagnostics;
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
    ///
    /// ABOUT/CHANGES resources are looked up locale-aware via
    /// <see cref="PluginResource.ReadLocalized"/>: the request's Accept-Language
    /// drives <see cref="System.Globalization.CultureInfo.CurrentUICulture"/>,
    /// which falls back from <c>ru-RU</c> → <c>ru</c> → invariant.
    /// </summary>
    [ApiController]
    [AllowAnonymous]
    [Route("api/hub/[controller]")]
    public class MetaController : ControllerBase
    {
        private static readonly Guid HubGuid = Guid.Parse(HubUiPlugin.PluginGuid);
        private static readonly Assembly PluginAssembly = typeof(HubUiPlugin).Assembly;

        private readonly IPluginContainer _container;

        public MetaController(IPluginContainer container)
        {
            _container = container;
        }

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

            var content = PluginResource.ReadLocalized(plugin.GetType().Assembly, "ABOUT");
            return content is null
                ? NotFound()
                : Content(content, "text/markdown; charset=utf-8");
        }
    }
}
