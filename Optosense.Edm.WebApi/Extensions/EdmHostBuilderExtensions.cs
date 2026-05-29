using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json.Serialization;
using Microprojects.Edm;
using Microprojects.Edm.Contracts.ProcessDefinition;
using Microprojects.Edm.Host;
using Microprojects.Edm.Host.SignalR;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.EventLog;
using Optosense.Edm.WebApi.Services;
using Optosense.Edm.WebApi.Utils;

namespace Optosense.Edm.WebApi.Extensions;

public static class EdmHostBuilderExtensions
{
    public static void AddEdm(this IHostApplicationBuilder builder)
    {
        builder.Services.AddProblemDetails();
        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

        // Resource catalogs live alongside the throwing code in each plugin
        // (e.g. Microprojects.Edm.Ui.Logistics/Resources/Errors.{en,ru}.resx).
        // RequestLocalization wires Accept-Language → CurrentUICulture so
        // ResourceManager.GetString picks the right .resx automatically.
        builder.Services.AddLocalization();

        builder.Services.Configure<IntercomOptions>(builder.Configuration.GetSection("Edm:Intercom"));
        builder.Services.Configure<Peer>(options => ConfigurePeer(options, builder.Configuration, builder.Environment));

        builder.AddCache();
        builder.AddOperationIntercom();

        builder.Services.AddGrpc();
        builder.Services.AddSignalR().AddJsonProtocol(o =>
        {
            o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false));
        });
        builder.Services.AddControllers().AddNewtonsoftJson(o => { });

        // Root-tier shared services. These MUST be registered before
        // AddPlugins so they live in the root descriptor snapshot that
        // each plugin's child container delegates into via
        // reference-handover. Anything plugins inject for themselves
        // (DirectoryService, leaf services) stays plugin-tier.
        builder.Services.AddScoped<IUserService, UserService>();

        // Cross-plugin contract bridges. Registered here (before AddPlugins)
        // so they live in the root descriptor snapshot and are delegated into
        // every plugin's child container. A consumer plugin that does not
        // register its own impl resolves this forwarder, which bridges into
        // the provider plugin's scope. See ForwardingProcessDefinitionService.
        builder.Services.AddScoped<IProcessDefinitionService, ForwardingProcessDefinitionService>();

        // Custom controller activator dispatches controller construction
        // to the owning plugin's IServiceProvider so each plugin can only
        // resolve its own scoped services. Registered here (before
        // AddPlugins) so the default activator registered by AddControllers
        // is replaced before plugin assemblies are scanned. SignalR hubs
        // currently live only in the host assembly (IntercomHub) — the
        // default IHubActivator handles them correctly. If a plugin ever
        // ships its own Hub class, mirror this pattern with an
        // IHubActivator<> replacement.
        builder.Services.Replace(
            ServiceDescriptor.Transient<IControllerActivator, PluginScopedControllerActivator>());

        builder.Services.AddPlugins(config =>
        {
            config.BaseDirectory = AppContext.BaseDirectory;
            var paths = builder.Configuration.GetSection("Edm:PluginsPaths").Get<string[]>();
            config.PluginsPaths = paths is { Length: > 0 } ? paths : new[] { "./Plugins" };
            config.Configuration = builder.Configuration;
        });
        builder.Services.AddHostedService<PluginLifecycleService>();
        builder.AddJobs();

        if (builder.Environment.IsDevelopment())
        {
            builder.Services.AddCors(o =>
            {
                o.AddDefaultPolicy(b => b
                    .SetIsOriginAllowed(_ => true)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials());
            });
        }

        builder.AddEdmAuth();

        builder.Services.AddWindowsService();
        builder.Services.AddHostedService<Worker>()
            .Configure<EventLogSettings>(config =>
            {
                config.LogName = "Microprojects";
                config.SourceName = "EDM Service";
            })
            .Configure<HostOptions>(options =>
                options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore);

        builder.Services.AddHttpContextAccessor();
    }

    public static void UseEdm(this WebApplication app)
    {
        // Materialize per-plugin IServiceProviders now that the root
        // container is built. Must run before any HTTP traffic, hence
        // before app.UseRouting / app.MapControllers.
        // PluginScopedControllerActivator depends on this being initialized.
        var pluginProviders = app.Services.GetRequiredService<PluginServiceProviderRegistry>();
        pluginProviders.Initialize(
            app.Services,
            app.Services.GetRequiredService<IPluginContainer>(),
            app.Services.GetRequiredService<PluginBlueprintRegistry>());

        app.UsePeer();
        app.UseJobs();
        app.JsonConfigure();
        app.UseRouting();
        if (app.Environment.IsDevelopment())
        {
            app.UseCors();
        }
        // RequestLocalization must run BEFORE the auth/exception middleware
        // so error messages thrown downstream resolve against the request's
        // CurrentUICulture (set from Accept-Language by AcceptLanguageHeaderRequestCultureProvider).
        var supportedCultures = new List<CultureInfo>
        {
            new("en"),
            new("ru"),
        };
        app.UseRequestLocalization(new RequestLocalizationOptions
        {
            DefaultRequestCulture = new RequestCulture("en"),
            SupportedCultures = supportedCultures,
            SupportedUICultures = supportedCultures,
            // Drop the cookie / query-string providers — Accept-Language is the
            // only signal we care about (Logistics SPA's axios interceptor
            // already sets it from i18n.language on every request).
        });
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseSession();
        app.UseEdmJwtCookieRefresh();
        app.UseExceptionHandler();

        app.MapGrpcService<EdmJobService>();
        app.MapHub<IntercomHub>(IntercomHub.Hub);
        app.MapGet("/status", () => "I AM ALIVE!");
        app.MapSpaPlugins();
    }

    private static void ConfigurePeer(Peer options, IConfiguration configuration, IHostEnvironment environment)
    {
        var section = configuration.GetSection("Kestrel:Endpoints").GetChildren();
        var grpcUri = new Uri(
            section.FirstOrDefault(s => s.Key == "GrpcSecure")?["Url"] ??
            section.FirstOrDefault(s => s.Key == "Grpc")?["Url"]);
        var uiUri = new Uri(
            section.FirstOrDefault(s => s.Key == "Https")?["Url"] ??
            section.FirstOrDefault(s => s.Key == "Http")?["Url"]);
        options.Host = $"{uiUri.Scheme}://{uiUri.Host}";
        options.GrpcPort = grpcUri.Port;
        options.UiPort = uiUri.Port;
        options.Version = typeof(Worker).Assembly.GetName().Version?.ToString();
        options.Mode = configuration.GetValue<string>("Edm:Mode");
        options.Environment = environment.EnvironmentName;
    }
}
