using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Edm.IntegrationTests;

// Boots the Optosense.Edm.WebApi host inside an in-process TestServer.
//
// The on-disk appsettings.json holds install-time placeholders ([GRPCURL],
// [HOSTNAME], …) that crash the Peer / SmartAuth configurators on `new Uri()`.
// We override those values via environment variables (read by the framework's
// AddEnvironmentVariables() source during WebApplication.CreateBuilder, which
// runs BEFORE AddPlugins() inside Program.Main). A `ConfigureAppConfiguration`
// callback would be too late — it runs at Build() time, after AddPlugins has
// already eagerly enumerated Edm:Assemblies.
//
// IConfiguration arrays merge by index, so to fully replace appsettings.json's
// Edm:Assemblies array we set the indices we want and zero out higher slots up
// to MaxAssembliesToOverride (PluginManagerHelper just logs a warning on
// empty/missing paths and continues).
//
// Tests that need a different plugin set subclass this factory and override
// `PluginAssemblyPaths`.
public class EdmWebApplicationFactory : WebApplicationFactory<Program>
{
    private const int MaxAssembliesToOverride = 16;

    static EdmWebApplicationFactory()
    {
        // Substitute appsettings.json's [GRPCURL]/[HOSTNAME]/[MODE]/etc.
        // placeholders. SetIfUnset preserves anything the developer/CI already
        // set, so an outer harness can still override.
        SetIfUnset("Kestrel__Endpoints__Https__Url", "https://localhost:16332");
        SetIfUnset("Kestrel__Endpoints__GrpcSecure__Url", "https://localhost:16334");
        SetIfUnset("Kestrel__Endpoints__GrpcSecure__Protocols", "Http1AndHttp2");
        SetIfUnset("Kestrel__Endpoints__GrpcSecure__ClientCertificateMode", "AllowCertificate");
        SetIfUnset("Kestrel__Certificates__Default__Subject", "localhost");
        SetIfUnset("Kestrel__Certificates__Default__AllowInvalid", "true");
        SetIfUnset("Edm__Mode", "Administrative");
        SetIfUnset("Edm__Intercom__Principal", "https://localhost:16334");
        SetIfUnset("Edm__Auth__Jwt__Key", "INTEGRATION_TESTS_JWT_KEY_AT_LEAST_256_BITS_LONG_FOR_HS256");
    }

    public EdmWebApplicationFactory()
    {
        // Replace appsettings.json's Edm:Assemblies array entry-by-entry.
        // Slots beyond our list are explicitly set to "" so leftover JSON
        // entries can't slip through.
        for (var i = 0; i < MaxAssembliesToOverride; i++)
        {
            Environment.SetEnvironmentVariable(
                $"Edm__Assemblies__{i}",
                i < PluginAssemblyPaths.Count ? PluginAssemblyPaths[i] : "");
        }
    }

    // Absolute paths so resolution doesn't depend on which directory the host
    // ends up treating as "base" (ContentRoot vs AppContext.BaseDirectory
    // differ between WebApplicationFactory and a normal `dotnet run`).
    protected virtual IReadOnlyList<string> PluginAssemblyPaths { get; } =
    [
        Path.Combine(
            AppContext.BaseDirectory,
            "Plugins",
            "Optosense.Edm.Drivers.Null",
            "Optosense.Edm.Drivers.Null.dll"),
    ];

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("IntegrationTests");

        // The host registers an EventLog logger via AddWindowsService(). In the
        // test process the EventLog provider is disposed during teardown, but
        // JobContainer's background tasks still try to log errors on shutdown
        // → ObjectDisposedException → unhandled-on-threadpool → testhost abort
        // (which loses test results). Drop all logger providers and use console
        // only.
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddConsole();
        });

        builder.ConfigureTestServices(services =>
        {
            // PluginLifecycleService.StopAsync calls _serviceProvider.CreateScope()
            // after the root provider is being disposed, which throws and bubbles up
            // as a TestClassCleanupFailure. Production rarely hits this (process is
            // killed before clean shutdown), but every test fixture dispose does.
            // Strip it for tests; the lifecycle service is not what we're exercising.
            var lifecycle = services.FirstOrDefault(d =>
                d.ServiceType == typeof(IHostedService) &&
                d.ImplementationType?.Name == "PluginLifecycleService");
            if (lifecycle is not null)
            {
                services.Remove(lifecycle);
            }

            // Production wires DefaultChallengeScheme = Negotiate, but Negotiate
            // throws on TestServer (no IConnectionItemsFeature). Negotiate
            // implements IAuthenticationRequestHandler, so AuthenticationMiddleware
            // invokes it on every request regardless of the default scheme — just
            // re-pointing defaults doesn't help. We have to physically remove it
            // from the scheme registry, then add a no-op anonymous scheme as the
            // new default. The auth pipeline still runs and FallbackPolicy still
            // 401s, but no request can trigger the Negotiate handshake.
            services.AddAuthentication()
                .AddScheme<AuthenticationSchemeOptions, AnonymousAuthenticationHandler>(
                    AnonymousAuthenticationHandler.SchemeName, _ => { });
            services.PostConfigure<AuthenticationOptions>(opts =>
            {
                // We can't remove from opts.Schemes (read-only in this version),
                // and AuthenticationSchemeProvider reads from Schemes at startup.
                // Instead, swap the Negotiate scheme's HandlerType to our
                // anonymous handler. AnonymousAuthenticationHandler doesn't
                // implement IAuthenticationRequestHandler, so AuthenticationMiddleware
                // won't invoke HandleRequestAsync for the Negotiate scheme — which
                // is what crashes on TestServer.
                if (opts.SchemeMap.TryGetValue("Negotiate", out var negotiate))
                {
                    negotiate.HandlerType = typeof(AnonymousAuthenticationHandler);
                }
                opts.DefaultAuthenticateScheme = AnonymousAuthenticationHandler.SchemeName;
                opts.DefaultChallengeScheme = AnonymousAuthenticationHandler.SchemeName;
            });
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
