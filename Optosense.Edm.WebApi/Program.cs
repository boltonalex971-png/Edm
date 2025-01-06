using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Cache.Redis;
using Microprojects.Edm.Intercom;
using Microprojects.Edm.Jobs;
using Microprojects.Edm.Utils;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Hosting.WindowsServices;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.EventLog;
using Microsoft.Extensions.Options;
using Optosense.Edm.Core.AspNet;
using Optosense.Edm.Core.AspNet.Auth;
using Optosense.Edm.DataAccess;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Persistence;
using Optosense.Edm.WebApi;
using Optosense.Edm.WebApi.Services;
using Optosense.Edm.WebApi.Utils;

var options = new WebApplicationOptions
{
    Args = args,
    ContentRootPath = WindowsServiceHelpers.IsWindowsService() ? AppContext.BaseDirectory : default
};

var builder = WebApplication.CreateBuilder(options);
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddDbContextPool<EdmContext>((provider, options) =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("Edm"),
        sqlOptions => sqlOptions
            .MigrationsAssembly("Optosense.Edm.DataAccess")
            .UseCompatibilityLevel(120)); // This is workaround for EF 8 and "Contains" problem
    var loggerFactory = provider.GetRequiredService<ILoggerFactory>();
    options.UseLoggerFactory(loggerFactory);
}, poolSize: 128);
builder.Services.AddPooledDbContextFactory<EdmContext>((provider, options) =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("Edm"),
        sqlOptions => sqlOptions
        .MigrationsAssembly("Optosense.Edm.DataAccess")
        .UseCompatibilityLevel(120));
    var loggerFactory = provider.GetRequiredService<ILoggerFactory>();
    options.UseLoggerFactory(loggerFactory);
}, poolSize: 16);

builder.Services.Configure<IntercomOptions>(builder.Configuration.GetSection("Edm:Intercom"));
builder.Services.Configure<Peer>(options =>
{
    var section = builder.Configuration.GetSection("Kestrel:Endpoints").GetChildren();
    var grpcUri = new Uri(
        section.FirstOrDefault(s => s.Key == "GrpcSecure")?["Url"] ??
                section.FirstOrDefault(s => s.Key == "Grpc")?["Url"]);
    var uiUri = new Uri(
        section.FirstOrDefault(s => s.Key == "Https")?["Url"] ??
                section.FirstOrDefault(s => s.Key == "Http")?["Url"]);
    options.Host = $"{uiUri.Scheme}://{uiUri.Host}";
    options.GrpcPort = grpcUri.Port;
    options.UiPort = uiUri.Port;
    options.Version = typeof(Worker).Assembly.GetName().Version.ToString();
    options.Mode = builder.Configuration.GetValue<string>("Edm:Mode");
    options.Environment = builder.Environment.EnvironmentName;
});
//System.Diagnostics.Debugger.Launch();
builder.AddCache();
builder.AddOperationIntercom();
builder.Services.AddGrpc();
builder.Services.AddSignalR();
builder.Services.AddPlugins(config =>
{
    config.BaseDirectory = AppContext.BaseDirectory;
    config.PluginsPath = builder.Configuration.GetSection("Edm:Assemblies").GetChildren().Select(c => c.Value);
    config.Configuration = builder.Configuration;
});
builder.AddJobs();

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCorsPolicy", builder =>
    {
        builder.AllowAnyOrigin();
        builder.AllowAnyHeader();
        builder.AllowAnyMethod();
    });
});

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(session =>
{
    session.Cookie.Name = ".Edm.Session";
    session.IdleTimeout = TimeSpan.FromMinutes(10);
    session.Cookie.IsEssential = true;
});
if (builder.Environment.IsProduction())
{
    builder.Services.AddSingleton<IAuthorizationHandler, HubAuthHandler>();
    builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme).AddNegotiate();
    builder.Services.AddAuthorization(options =>
    {
        options.FallbackPolicy = options.DefaultPolicy;
    });
}
else
{
    builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie();
}

builder.Services.AddHostedService<Worker>()
    .Configure<EventLogSettings>(config =>
    {
        config.LogName = "Microprojects";
        config.SourceName = "EDM Service";
    }).Configure<HostOptions>(options => options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore);
builder.Host.UseWindowsService();

var app = builder.Build();

app.UsePeer();

if (builder.Configuration.GetValue<string>("Edm:Mode") == "admin" && app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<EdmContext>();
        db.Database.Migrate();
    }
}

var jobContainer = app.Services.GetService<IJobContainer>();
jobContainer.Start();

app.JsonConfigure();
app.UseCors("DevCorsPolicy");


app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseSession();
if (app.Environment.IsDevelopment())
{
    app.UseCookiePolicy(new CookiePolicyOptions { });
    app.UseFakeUserInfo();
}
else
{
    app.UseAuthenticatedUserInfo();
}
app.UseExceptionHandler();
app.MapGrpcService<EdmJobService>().AllowAnonymous();
app.MapHub<IntercomHub>(IntercomHub.Hub).AllowAnonymous();
app.MapGet("/status", () => "I AM ALIVE!");
app.MapSpaPlugins();

await app.RunAsync();

internal sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IProblemDetailsService _problemDetailsService;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IProblemDetailsService problemDetailsService)
    {
        _logger = logger;
        _problemDetailsService = problemDetailsService;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var problemDetails = new ProblemDetails
        {
            Type = "Bad request",
            Status = StatusCodes.Status400BadRequest,
            Title = exception.GetType().Name,
            Detail = exception.GetMeaningfulMessage(),
            Instance = $"{httpContext.Request.Method} {httpContext.Request.Path}"
        };
        _logger.LogError(exception, "{Type}: {Instance} {Message}", problemDetails.Type, problemDetails.Instance, problemDetails.Detail);
        httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            ProblemDetails = problemDetails,
            HttpContext = httpContext
        });
    }
}