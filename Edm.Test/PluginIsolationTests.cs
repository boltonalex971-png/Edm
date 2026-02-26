using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microprojects.Edm.Plugins;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using System;
using System.Linq;
using System.Threading.Tasks;
using Optosense.Edm.Plugins;

namespace Edm.Test
{
    /// <summary>
    /// Tests for plugin isolation functionality
    /// </summary>
    [TestClass]
    public class PluginIsolationTests
    {
        private ILogger<PluginRegistry> _logger;

        [TestInitialize]
        public void TestInitialize()
        {
            _logger = NullLogger<PluginRegistry>.Instance;
        }

        /// <summary>
        /// Verifies that PluginRegistry can register and track plugins
        /// </summary>
        [TestMethod]
        public void PluginRegistry_Register_AddsPluginToRegistry()
        {
            // Arrange
            var registry = new PluginRegistry(_logger);
            var mockPlugin = new TestPlugin();

            // Act
            registry.Register(mockPlugin.Guid, mockPlugin, null);
            var entry = registry.GetPlugin(mockPlugin.Guid);

            // Assert - registered
            Assert.IsNotNull(entry);
            Assert.AreEqual(mockPlugin.Guid, entry.Guid);
            Assert.AreEqual(PluginStatus.Loaded, entry.Status);
            Assert.AreEqual(mockPlugin, entry.Plugin);
        }

        /// <summary>
        /// Verifies that PluginRegistry can unload plugins
        /// </summary>
        [TestMethod]
        public async Task PluginRegistry_UnloadPlugin_RemovesFromRegistry()
        {
            // Arrange
            var registry = new PluginRegistry(_logger);
            var mockPlugin = new TestPlugin();

            registry.Register(mockPlugin.Guid, mockPlugin, null);
            
            // Act - unload
            var result = await registry.UnloadPluginAsync(mockPlugin.Guid);

            // Assert - unloaded and removed from registry
            Assert.IsTrue(result);
            var entry = registry.GetPlugin(mockPlugin.Guid);
            Assert.IsNull(entry);
        }

        /// <summary>
        /// Verifies that PluginRegistry tracks multiple plugins
        /// </summary>
        [TestMethod]
        public void PluginRegistry_GetAllPlugins_ReturnsAllRegistered()
        {
            // Arrange
            var registry = new PluginRegistry(_logger);
            var plugin1 = new TestPlugin { Name = "Plugin1" };
            var plugin2 = new TestPlugin { Name = "Plugin2" };
            var plugin3 = new TestPlugin { Name = "Plugin3" };

            // Act
            registry.Register(plugin1.Guid, plugin1, null);
            registry.Register(plugin2.Guid, plugin2, null);
            registry.Register(plugin3.Guid, plugin3, null);

            var allPlugins = registry.GetAllPlugins().ToList();

            // Assert
            Assert.AreEqual(3, allPlugins.Count);
            CollectionAssert.Contains(allPlugins.Select(p => p.Plugin.Name).ToList(), "Plugin1");
            CollectionAssert.Contains(allPlugins.Select(p => p.Plugin.Name).ToList(), "Plugin2");
            CollectionAssert.Contains(allPlugins.Select(p => p.Plugin.Name).ToList(), "Plugin3");
        }

        /// <summary>
        /// Verifies that unloading non-existent plugin returns false
        /// </summary>
        [TestMethod]
        public async Task PluginRegistry_UnloadNonExistentPlugin_ReturnsFalse()
        {
            // Arrange
            var registry = new PluginRegistry(_logger);
            var nonExistentGuid = Guid.NewGuid();

            // Act
            var result = await registry.UnloadPluginAsync(nonExistentGuid);

            // Assert
            Assert.IsFalse(result);
        }

        /// <summary>
        /// Verifies PluginEntry health calculation
        /// </summary>
        [TestMethod]
        public void PluginEntry_Health_CalculatedFromStatus()
        {
            // Arrange & Act
            var loadedEntry = new PluginEntry { Status = PluginStatus.Loaded };
            var initializedEntry = new PluginEntry { Status = PluginStatus.Initialized };
            var unloadedEntry = new PluginEntry { Status = PluginStatus.Unloaded };
            var failedEntry = new PluginEntry { Status = PluginStatus.FailedToInitialize };

            // Assert
            Assert.AreEqual(PluginHealth.Healthy, loadedEntry.Health);
            Assert.AreEqual(PluginHealth.Healthy, initializedEntry.Health);
            Assert.AreEqual(PluginHealth.Unloaded, unloadedEntry.Health);
            Assert.AreEqual(PluginHealth.Unhealthy, failedEntry.Health);
        }

        /// <summary>
        /// Verifies that registry count is accurate
        /// </summary>
        [TestMethod]
        public void PluginRegistry_Count_ReturnsCorrectCount()
        {
            // Arrange
            var registry = new PluginRegistry(_logger);
            
            // Act - initially empty
            var initialCount = registry.Count;
            
            // Act - add plugins
            registry.Register(Guid.NewGuid(), new TestPlugin { Name = "Test1" }, null);
            registry.Register(Guid.NewGuid(), new TestPlugin { Name = "Test2" }, null);
            var afterAddCount = registry.Count;

            // Assert
            Assert.AreEqual(0, initialCount);
            Assert.AreEqual(2, afterAddCount);
        }
    }

    /// <summary>
    /// Test plugin implementation for unit tests
    /// </summary>
    public class TestPlugin : IPlugin
    {
        public Guid Guid { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = "TestPlugin";
        public string Description { get; set; } = "Test plugin for unit tests";
        public string Homepage { get; set; } = "/test";

        public void InjectDependencies(Microsoft.Extensions.DependencyInjection.IServiceCollection services, Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            // No-op for tests
        }
    }
}
