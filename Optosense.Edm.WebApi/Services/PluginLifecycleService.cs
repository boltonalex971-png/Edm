using Microprojects.Edm.Plugins;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Host;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Optosense.Edm.WebApi.Services
{
    /// <summary>
    /// Hosted service that manages plugin lifecycle (initialization and shutdown)
    /// </summary>
    public class PluginLifecycleService : IHostedService
    {
        private readonly ILogger<PluginLifecycleService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly PluginRegistry _registry;

        public PluginLifecycleService(
            ILogger<PluginLifecycleService> logger,
            IServiceProvider serviceProvider,
            PluginRegistry registry)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
            _registry = registry;
        }

        /// <summary>
        /// Initialize all plugins that support lifecycle management
        /// </summary>
        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Plugin Lifecycle Service starting...");

            using var scope = _serviceProvider.CreateScope();
            var plugins = scope.ServiceProvider.GetRequiredService<IEnumerable<IPlugin>>();

            foreach (var plugin in plugins.OfType<IPluginLifecycle>())
            {
                try
                {
                    using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                    cts.CancelAfter(TimeSpan.FromSeconds(60)); // 60 second timeout per plugin

                    await plugin.InitializeAsync(scope.ServiceProvider, cts.Token);
                    _registry.UpdateStatus(plugin.Guid, PluginStatus.Initialized);

                    _logger.LogInformation("Plugin {Name} initialized successfully", plugin.Name);
                }
                catch (Exception ex)
                {
                    _registry.RecordError(plugin.Guid, ex);
                    _logger.LogError(ex, "Failed to initialize plugin {Name}", plugin.Name);
                }
            }

            _logger.LogInformation("Plugin Lifecycle Service started. {Count} plugins loaded.", plugins.Count());
        }

        /// <summary>
        /// Unload all plugins gracefully
        /// </summary>
        public async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Plugin Lifecycle Service stopping...");

            await _registry.UnloadAllAsync();
            await PluginManagerHelper.UnloadAllPluginsAsync();

            _logger.LogInformation("All plugins unloaded");
        }
    }
}
