using System;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Plugins;

namespace Microprojects.Edm.Plugins
{
    /// <summary>
    /// Optional interface for plugins that need lifecycle management.
    /// Implement to receive initialization and shutdown callbacks.
    /// </summary>
    public interface IPluginLifecycle : IPlugin
    {
        /// <summary>
        /// Called when plugin is loaded - for async initialization.
        /// Use this to initialize resources, start background tasks, or validate configuration.
        /// </summary>
        /// <param name="serviceProvider">Application service provider for resolving dependencies</param>
        /// <param name="cancellationToken">Cancellation token for initialization timeout</param>
        Task InitializeAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken);

        /// <summary>
        /// Called when plugin is being unloaded - for cleanup.
        /// Use this to dispose resources, stop background tasks, and clean up state.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token for shutdown timeout</param>
        Task ShutdownAsync(CancellationToken cancellationToken);
    }

    /// <summary>
    /// Optional interface for plugins that want to report health status.
    /// </summary>
    public interface IPluginHealthCheck
    {
        /// <summary>
        /// Gets the current health status of the plugin.
        /// </summary>
        PluginHealth GetHealth();

        /// <summary>
        /// Gets additional health details (optional).
        /// </summary>
        string? GetHealthDetails() => null;
    }
}
