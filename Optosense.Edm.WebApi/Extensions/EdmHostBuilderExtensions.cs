using System;
using System.Linq;
using System.Text.Json.Serialization;
using Microprojects.Edm;
using Microprojects.Edm.Host;
using Microprojects.Edm.Host.SignalR;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
        app.UsePeer();
        app.UseJobs();
        app.JsonConfigure();
        app.UseRouting();
        if (app.Environment.IsDevelopment())
        {
            app.UseCors();
        }
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
