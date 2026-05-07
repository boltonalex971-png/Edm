using Microprojects.Edm.Plugins;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Edm.IntegrationTests;

public class PluginLoadingTests : IClassFixture<EdmWebApplicationFactory>
{
    private readonly EdmWebApplicationFactory _factory;

    public PluginLoadingTests(EdmWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void Null_driver_plugin_is_loaded_into_container()
    {
        // Force host construction so AddPlugins runs and the registry fills.
        _ = _factory.CreateClient();

        var container = _factory.Services.GetRequiredService<IPluginContainer>();
        var drivers = container.GetDrivers().ToList();

        // The Null driver's GUID — declared on NullDriverPlugin.
        var nullGuid = new Guid("ABC4FDD6-E58D-4CEA-96D9-20EAAB6B99CA");

        Assert.Contains(drivers, d => d.Guid == nullGuid);

        var nullDriver = container.GetDriver(nullGuid);
        Assert.NotNull(nullDriver);
        Assert.Equal("Null", nullDriver.Name);
    }
}
