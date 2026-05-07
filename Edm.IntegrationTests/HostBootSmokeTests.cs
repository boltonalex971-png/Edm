using System.Net;
using Xunit;

namespace Edm.IntegrationTests;

public class HostBootSmokeTests : IClassFixture<EdmWebApplicationFactory>
{
    private readonly EdmWebApplicationFactory _factory;

    public HostBootSmokeTests(EdmWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void Host_boots_and_resolves_root_services()
    {
        using var client = _factory.CreateClient();
        Assert.NotNull(client);
    }

    [Fact]
    public async Task Unknown_route_returns_401_under_fallback_policy()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/__no_such_route__");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Status_endpoint_requires_auth()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/status");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
