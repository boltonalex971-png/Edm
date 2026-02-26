using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Loader;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Plugins;

namespace Microprojects.Edm.Plugins
{
    /// <summary>
    /// Registry for tracking loaded plugins and their load contexts.
    /// Enables plugin unloading and health monitoring.
    /// </summary>
    public class PluginRegistry
    {
        private readonly ConcurrentDictionary<Guid, PluginEntry> _plugins = new();
        private readonly ILogger<PluginRegistry> _logger;

        public PluginRegistry(ILogger<PluginRegistry> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Registers a plugin in the registry
        /// </summary>
        public void Register(Guid guid, IPlugin plugin, AssemblyLoadContext context)
        {
            _plugins[guid] = new PluginEntry
            {
                Guid = guid,
                Plugin = plugin,
                LoadContext = context,
                LoadedAt = DateTime.UtcNow,
                Status = PluginStatus.Loaded
            };

            _logger.LogInformation("Plugin {Name} ({Guid}) registered", plugin.Name, guid);
        }

        /// <summary>
        /// Gets a plugin entry by GUID
        /// </summary>
        public PluginEntry? GetPlugin(Guid guid)
        {
            return _plugins.TryGetValue(guid, out var entry) ? entry : null;
        }

        /// <summary>
        /// Gets all registered plugins
        /// </summary>
        public IEnumerable<PluginEntry> GetAllPlugins() => _plugins.Values;

        /// <summary>
        /// Gets count of loaded plugins
        /// </summary>
        public int Count => _plugins.Count;

        /// <summary>
        /// Unloads a specific plugin by GUID
        /// </summary>
        public async Task<bool> UnloadPluginAsync(Guid guid)
        {
            if (!_plugins.TryRemove(guid, out var entry))
            {
                _logger.LogWarning("Plugin {Guid} not found for unload", guid);
                return false;
            }

            try
            {
                entry.Status = PluginStatus.Unloading;

                // Call shutdown hook if available
                if (entry.Plugin is IPluginLifecycle lifecycle)
                {
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                    await lifecycle.ShutdownAsync(cts.Token);
                }

                // Unload the context
                if (entry.LoadContext is AssemblyLoadContext alc)
                {
                    alc.Unload();
                    _logger.LogInformation("Plugin {Name} unloaded successfully", entry.Plugin.Name);
                }

                entry.Status = PluginStatus.Unloaded;
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to unload plugin {Name}", entry.Plugin.Name);
                entry.LastError = ex;
                entry.Status = PluginStatus.FailedToUnload;
                _plugins[guid] = entry; // Put it back
                return false;
            }
        }

        /// <summary>
        /// Unloads all registered plugins
        /// </summary>
        public async Task UnloadAllAsync()
        {
            var tasks = _plugins.Keys.Select(UnloadPluginAsync);
            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// Updates plugin status
        /// </summary>
        public void UpdateStatus(Guid guid, PluginStatus status)
        {
            if (_plugins.TryGetValue(guid, out var entry))
            {
                entry.Status = status;
            }
        }

        /// <summary>
        /// Records an error for a plugin
        /// </summary>
        public void RecordError(Guid guid, Exception ex)
        {
            if (_plugins.TryGetValue(guid, out var entry))
            {
                entry.LastError = ex;
                entry.Status = PluginStatus.FailedToInitialize;
            }
        }
    }

    /// <summary>
    /// Represents a registered plugin in the registry
    /// </summary>
    public class PluginEntry
    {
        public Guid Guid { get; set; }
        public IPlugin Plugin { get; set; } = null!;
        public AssemblyLoadContext? LoadContext { get; set; }
        public DateTime LoadedAt { get; set; }
        public PluginStatus Status { get; set; }
        public Exception? LastError { get; set; }

        /// <summary>
        /// Gets the health status of the plugin
        /// </summary>
        public PluginHealth Health => Status switch
        {
            PluginStatus.Loaded or PluginStatus.Initialized => PluginHealth.Healthy,
            PluginStatus.Unloading or PluginStatus.Unloaded => PluginHealth.Unloaded,
            PluginStatus.FailedToLoad or PluginStatus.FailedToInitialize or PluginStatus.FailedToUnload => PluginHealth.Unhealthy,
            _ => PluginHealth.Unknown
        };
    }

    /// <summary>
    /// Plugin lifecycle status
    /// </summary>
    public enum PluginStatus
    {
        Loading,
        Loaded,
        Initialized,
        FailedToLoad,
        FailedToInitialize,
        Unloading,
        Unloaded,
        FailedToUnload
    }

    /// <summary>
    /// Plugin health status
    /// </summary>
    public enum PluginHealth
    {
        Healthy,
        Degraded,
        Unhealthy,
        Unloaded,
        Unknown
    }
}
