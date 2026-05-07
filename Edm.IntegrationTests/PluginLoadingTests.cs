using Microprojects.Edm.Plugins;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Edm.IntegrationTests;

public class PluginLoadingTests : IClassFixture<EdmWebApplicationFactory>
{
    private static readonly Guid NullDriverGuid = new("ABC4FDD6-E58D-4CEA-96D9-20EAAB6B99CA");

    private readonly EdmWebApplicationFactory _factory;

    public PluginLoadingTests(EdmWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void Null_driver_plugin_is_loaded_into_container()
    {
        _ = _factory.CreateClient();

        var container = _factory.Services.GetRequiredService<IPluginContainer>();
        var drivers = container.GetDrivers().ToList();

        Assert.Contains(drivers, d => d.Guid == NullDriverGuid);

        var nullDriver = container.GetDriver(NullDriverGuid);
        Assert.NotNull(nullDriver);
        Assert.Equal("Null", nullDriver.Name);
    }
}
