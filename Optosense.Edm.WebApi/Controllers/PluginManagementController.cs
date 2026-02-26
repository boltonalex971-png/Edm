using Microprojects.Edm.Plugins;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Optosense.Edm.Plugins;

namespace Optosense.Edm.WebApi.Controllers
{
    /// <summary>
    /// Administrative controller for plugin management
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "EDMAdmins")]
    public class PluginManagementController : ControllerBase
    {
        private readonly IPluginContainer _pluginContainer;
        private readonly PluginRegistry _registry;
        private readonly ILogger<PluginManagementController> _logger;

        public PluginManagementController(
            IPluginContainer pluginContainer,
            PluginRegistry registry,
            ILogger<PluginManagementController> logger)
        {
            _pluginContainer = pluginContainer;
            _registry = registry;
            _logger = logger;
        }

        /// <summary>
        /// List all loaded plugins with their status and health
        /// </summary>
        [HttpGet]
        public IActionResult GetPlugins()
        {
            var plugins = _registry.GetAllPlugins().Select(p => new
            {
                p.Guid,
                p.Plugin.Name,
                p.Plugin.Description,
                p.Plugin.Homepage,
                p.LoadedAt,
                Status = p.Status.ToString(),
                Health = p.Health.ToString(),
                Error = p.LastError?.Message
            });

            return Ok(plugins);
        }

        /// <summary>
        /// Get detailed health status for all plugins
        /// </summary>
        [HttpGet("health")]
        public IActionResult GetAllPluginHealth()
        {
            if (_pluginContainer is PluginManager manager)
            {
                var healthStatus = manager.GetPluginHealthStatus();
                return Ok(healthStatus);
            }

            return StatusCode(500, new { error = "PluginManager not available" });
        }

        /// <summary>
        /// Get health status of a specific plugin
        /// </summary>
        [HttpGet("{guid}/health")]
        public IActionResult GetPluginHealth(Guid guid)
        {
            var plugin = _pluginContainer.GetPlugin(guid);
            if (plugin == null)
                return NotFound(new { error = $"Plugin {guid} not found" });

            var health = _pluginContainer.GetPluginHealth(guid);
            return Ok(new { guid, health = health.ToString() });
        }

        /// <summary>
        /// Unload a specific plugin by GUID
        /// </summary>
        [HttpPost("{guid}/unload")]
        public async Task<IActionResult> UnloadPlugin(Guid guid)
        {
            var plugin = _pluginContainer.GetPlugin(guid);
            if (plugin == null)
                return NotFound(new { error = $"Plugin {guid} not found" });

            var success = await _pluginContainer.UnloadPluginAsync(guid);

            if (success)
            {
                _logger.LogInformation("Plugin {Name} unloaded by user {User}",
                    plugin.Name, User.Identity?.Name);
                return Ok(new { message = $"Plugin {plugin.Name} unloaded successfully" });
            }

            return StatusCode(500, new { error = "Failed to unload plugin. Check logs for details." });
        }

        /// <summary>
        /// Get count of loaded plugins
        /// </summary>
        [HttpGet("count")]
        public IActionResult GetPluginCount()
        {
            return Ok(new { count = _registry.Count });
        }
    }
}
