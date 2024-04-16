using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Cache.Redis;
using Microprojects.Edm.Intercom;
using Microprojects.Edm.Jobs;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Connections;
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
using Optosense.Edm.DataAccess;
using Optosense.Edm.Persistence;
using Optosense.Edm.WebApi;
using Optosense.Edm.WebApi.Services;
using Optosense.Edm.WebApi.Utils;
using static System.Collections.Specialized.BitVector32;

var options = new WebApplicationOptions
{
    Args = args,
    ContentRootPath = WindowsServiceHelpers.IsWindowsService() ? AppContext.BaseDirectory : default
};

var builder = WebApplication.CreateBuilder(options);
builder.WebHost.ConfigureLogging(configureLogging => configureLogging.AddFilter<EventLogLoggerProvider>(level => level >= LogLevel.Warning));

builder.Services.AddDbContextPool<EdmContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("Edm"),
        sqlOptions => sqlOptions
            .MigrationsAssembly("Optosense.Edm.DataAccess")
            .UseCompatibilityLevel(120)), // This is workaround for EF 8 and "Contains" problem
    poolSize: 128);
builder.Services.AddPooledDbContextFactory<EdmContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("Edm"),
        sqlOptions => sqlOptions
        .MigrationsAssembly("Optosense.Edm.DataAccess")
        .UseCompatibilityLevel(120)),
    poolSize: 16);

builder.Services.Configure<IntercomOptions>(builder.Configuration.GetSection("Edm:Intercom"));
builder.Services.Configure<Peer>(options =>
{
    var section = builder.Configuration.GetSection("Kestrel:Endpoints").GetChildren();
    var grpcUri = builder.Environment.IsDevelopment() ?
        new Uri(section.First(s => s.Key == "Grpc")["Url"]) :
        new Uri(section.First(s => s.Key == "GrpcSecure")["Url"]);
    var uiUri = builder.Environment.IsDevelopment() ?
        new Uri(section.First(s => s.Key == ("Http"))["Url"]) :
        new Uri(section.First(s => s.Key == ("Https"))["Url"]);
    options.Host = $"{uiUri.Scheme}://{uiUri.Host}";
    options.GrpcPort = grpcUri.Port;
    options.UiPort = uiUri.Port;
    options.Version = typeof(Worker).Assembly.GetName().Version.ToString();
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
    builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme).AddNegotiate();
}

builder.Services.AddHostedService<Worker>()
    .Configure<EventLogSettings>(config =>
    {
        config.LogName = "Microprojects";
        config.SourceName = "EDM Service";
    });
builder.Host.UseWindowsService();

var app = builder.Build();

var jobContainer = app.Services.GetService<IJobContainer>();
jobContainer.Start();

app.JsonConfigure();
app.UseCors("DevCorsPolicy");

app.UseSession();
if (app.Environment.IsDevelopment())
{
    app.UseFakeUserInfo();
}

app.UseRouting();
app.UseEndpoints(endpoints =>
{
    endpoints.MapGrpcService<EdmJobService>();
});
if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
    //app.UseHsts();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseAuthenticatedUserInfo();
}

app.MapHub<IntercomHub>(IntercomHub.Hub);
app.MapGet("/status", () => "I AM ALIVE!");
app.MapSpaPlugins();

await app.RunAsync();
