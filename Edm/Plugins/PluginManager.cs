using Microprojects.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microprojects.Edm.Plugins
{
    /// <summary>
    /// Plugin manager with registry support for isolated plugin loading
    /// </summary>
    public class PluginManager : IPluginContainer
    {
        private readonly IEnumerable<IPlugin> _plugins;
        private readonly PluginRegistry _registry;

        public PluginManager(IEnumerable<IPlugin> plugins, PluginRegistry registry)
        {
            _plugins = plugins;
            _registry = registry;

            // Register all plugins in registry
            foreach (var plugin in plugins)
            {
                _registry.Register(plugin.Guid, plugin, null);
            }
        }

        public IPlugin GetPlugin(Guid guid) => _plugins.FirstOrDefault(p => p.Guid == guid);

        public IEnumerable<IPlugin> GetAllPlugins() => _plugins;

        public IDriverPlugin GetDriver(Guid guid) => GetDrivers().FirstOrDefault(p => p.Guid == guid);

        public IEnumerable<IDriverPlugin> GetDrivers()
        {
            var result = _plugins
                .Where(p => typeof(IDriverPlugin).IsAssignableFrom(p.GetType()))
                .Cast<IDriverPlugin>()
                .ToList();
            return result;
        }

        IOperationPlugin IPluginContainer.GetMonitor(Guid guid) => GetOperations().FirstOrDefault(p => p.Guid == guid);

        public IEnumerable<IOperationPlugin> GetOperations()
        {
            var result = _plugins
                .Where(p => typeof(IOperationPlugin).IsAssignableFrom(p.GetType()))
                .Cast<IOperationPlugin>()
                .ToList();
            return result;
        }

        public IProfilePlugin GetProfile(Guid guid) => GetProfiles().FirstOrDefault(p => p.Guid == guid);

        /// <summary>
        /// Gets all driver plugins associated with a specific profile
        /// </summary>
        public IEnumerable<IDriverPlugin> GetProfileDrivers(Guid profileGuid)
        {
            return GetDrivers().Where(d => d.ProfileGuid == profileGuid);
        }

        public IEnumerable<IProfilePlugin> GetProfiles()
        {
            var result = _plugins
                .Where(p => typeof(IProfilePlugin).IsAssignableFrom(p.GetType()))
                .Cast<IProfilePlugin>()
                .ToList();
            return result;
        }

        public IProfilePlugin GetProfileByDriver(Guid driverGuid) => GetProfile(GetDriver(driverGuid)?.ProfileGuid ?? Guid.Empty);

        /// <summary>
        /// Unloads a plugin by GUID
        /// </summary>
        public async Task<bool> UnloadPluginAsync(Guid guid)
        {
            return await _registry.UnloadPluginAsync(guid);
        }

        /// <summary>
        /// Gets the health status of a plugin
        /// </summary>
        public PluginHealth GetPluginHealth(Guid guid)
        {
            var entry = _registry.GetPlugin(guid);
            return entry?.Health ?? PluginHealth.Unknown;
        }

        /// <summary>
        /// Gets all plugins with their health status
        /// </summary>
        public IEnumerable<PluginHealthInfo> GetPluginHealthStatus()
        {
            return _registry.GetAllPlugins().Select(entry => new PluginHealthInfo
            {
                Guid = entry.Guid,
                Name = entry.Plugin.Name,
                Health = entry.Health,
                Status = entry.Status,
                LoadedAt = entry.LoadedAt,
                Error = entry.LastError?.Message
            });
        }
    }

    /// <summary>
    /// Plugin health information DTO
    /// </summary>
    public class PluginHealthInfo
    {
        public Guid Guid { get; set; }
        public string Name { get; set; } = string.Empty;
        public PluginHealth Health { get; set; }
        public PluginStatus Status { get; set; }
        public DateTime LoadedAt { get; set; }
        public string? Error { get; set; }
    }
}
