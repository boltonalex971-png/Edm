using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Logging;

namespace Edm.IntegrationTests;

public class EdmWebApplicationFactory : WebApplicationFactory<Program>
{
    private const int MaxPathsToOverride = 16;

    // Env vars (not ConfigureAppConfiguration) — config is read inside Program.Main before any host-builder callback runs.
    static EdmWebApplicationFactory()
    {
        SetIfUnset("Kestrel__Endpoints__Https__Url", "https://localhost:16332");
        SetIfUnset("Kestrel__Endpoints__GrpcSecure__Url", "https://localhost:16334");
        SetIfUnset("Kestrel__Endpoints__GrpcSecure__Protocols", "Http1AndHttp2");
        SetIfUnset("Kestrel__Endpoints__GrpcSecure__ClientCertificateMode", "AllowCertificate");
        SetIfUnset("Kestrel__Certificates__Default__Subject", "localhost");
        SetIfUnset("Kestrel__Certificates__Default__AllowInvalid", "true");
        SetIfUnset("Edm__Mode", "Administrative");
        SetIfUnset("Edm__Intercom__Principal", "https://localhost:16334");
        SetIfUnset("Edm__Auth__Jwt__Key", "INTEGRATION_TESTS_JWT_KEY_AT_LEAST_256_BITS_LONG_FOR_HS256");
        SetIfUnset("Edm__Auth__Negotiate__Enabled", "false");
    }

    public EdmWebApplicationFactory()
    {
        for (var i = 0; i < MaxPathsToOverride; i++)
        {
            Environment.SetEnvironmentVariable(
                $"Edm__PluginsPaths__{i}",
                i < PluginsPaths.Count ? PluginsPaths[i] : "");
        }
    }

    // The host's subfolder scan picks up Plugins/<Name>/<Name>.dll under this root,
    // which matches the StageTestPlugins target layout in Edm.IntegrationTests.csproj.
    protected virtual IReadOnlyList<string> PluginsPaths { get; } =
    [
        Path.Combine(AppContext.BaseDirectory, "Plugins"),
    ];

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("IntegrationTests");

        // EventLog provider is disposed before background tasks finish logging — clearing avoids testhost abort on teardown.
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddConsole();
        });
    }

    private static void SetIfUnset(string key, string value)
    {
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}
