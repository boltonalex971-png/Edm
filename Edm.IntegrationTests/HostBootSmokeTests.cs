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
        // Materializing the client triggers full host construction (DI graph,
        // config binding, hosted services, MapSpaPlugins). If the boot path
        // regresses — placeholder tokens, missing JWT key, broken SmartAuth
        // wiring, zero plugins — this throws during creation.
        using var client = _factory.CreateClient();
        Assert.NotNull(client);
    }

    [Fact]
    public async Task Unknown_route_returns_401_under_fallback_policy()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/__no_such_route__");

        // Program.cs sets FallbackPolicy = RequireAuthenticatedUser, which
        // applies to *every* request — matched endpoint or not. So anonymous
        // requests to unknown routes return 401, not 404. (For 404 we'd have
        // to authenticate first.) This test pins the security posture.
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Status_endpoint_requires_auth()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/status");

        // /status is mapped without [AllowAnonymous], so the global
        // FallbackPolicy (RequireAuthenticatedUser) gates it. Unauthenticated
        // request → 401. This proves the auth pipeline is wired.
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
