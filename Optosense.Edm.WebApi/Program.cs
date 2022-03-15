using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Cache.Redis;
using Microprojects.Edm.Jobs;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Hosting.WindowsServices;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.EventLog;
using Optosense.Edm.Core.AspNet;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.DataAccess;
using Optosense.Edm.WebApi;
using Optosense.Edm.WebApi.Services;
using Optosense.Edm.WebApi.Utils;

{
    var options = new WebApplicationOptions
    {
        Args = args,
        ContentRootPath = WindowsServiceHelpers.IsWindowsService() ? AppContext.BaseDirectory : default
    };

    var builder = WebApplication.CreateBuilder(options);
    builder.WebHost.ConfigureLogging(configureLogging => configureLogging.AddFilter<EventLogLoggerProvider>(level => level >= LogLevel.Warning));
    builder.Services.AddDbContext<IEdmContext, EdmContext>(options =>
    {
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("Edm"));
    });
    builder.Services.AddSingleton<IEdmContextFactory>(new EdmContextFactory(builder.Configuration.GetConnectionString("Edm")));
    builder.Services.AddSingleton<ICache>(new RedisCache(builder.Configuration["Edm:Cache:Default:ConnectionString"]));
    builder.Services.AddGrpc();
    builder.Services.AddPlugins(config =>
    {
        config.BaseDirectory = AppContext.BaseDirectory;
        config.PluginsPath = builder.Configuration.GetSection("Edm:Assemblies").GetChildren().Select(c => c.Value);
        config.Configuration = builder.Configuration;
    });
    builder.Services.AddJobs();
    builder.Services.Configure<Peer>(options =>
    {
        var section = builder.Configuration.GetSection("Kestrel:Endpoints").GetChildren();
        var grpcUri = new Uri(section.First(s => s.Key.StartsWith("Grpc"))["Url"]);
        var uiUri = new Uri(section.First(s => s.Key.StartsWith("Http"))["Url"]);
        options.Host = $"{uiUri.Scheme}://{uiUri.Host}";
        options.GrpcPort = grpcUri.Port;
        options.UiPort = uiUri.Port;
        options.Version = typeof(Worker).Assembly.GetName().Version.ToString();
    });

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
        //builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme).AddNegotiate();
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
    app.UseRouting();
    //if (app.Environment.IsProduction())
    //{
    //    app.UseHttpsRedirection();
    //    app.UseHsts();
    //    app.UseAuthentication();
    //    app.UseAuthorization();
    //    app.UseAuthenticatedUserInfo();
    //}
    //else
    //{
        app.UseFakeUserInfo();
    //}

    app.UseEndpoints(endpoints =>
    {
        endpoints.MapGrpcService<EdmJobService>();
    });
    app.MapSpaPlugins();

    await app.RunAsync();
}