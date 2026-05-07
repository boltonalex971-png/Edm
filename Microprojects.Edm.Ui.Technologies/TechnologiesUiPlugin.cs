using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Jobs;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microprojects.Edm.Ui.Technologies.Services;
using Optosense.Edm.Core.Infrastructure;
using Optosense.Edm.Plugins;

namespace Microprojects.Edm.Ui.Technologies
{
    [OperationPlugin(
        Name = "Technologies",
        Description = "Technologies UI",
        Guid = "76123DAA-9A68-4F90-B6A9-F5F16633C7D6",
        SpaPath = "ClientApp/build",
        UiRoot = "technologies")]
    public class TechnologiesUiPlugin : PluginBase, IOperationPlugin
    {
        public override void InjectDependencies(IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContextPool<TechnologiesContext>((provider, options) =>
            {
                options.UseSqlServer(
                    configuration.GetConnectionString("Edm"),
                    sqlOptions => sqlOptions.UseCompatibilityLevel(140));
                var loggerFactory = provider.GetRequiredService<ILoggerFactory>();
                options.UseLoggerFactory(loggerFactory);
            }, poolSize: 128);
            services.AddPooledDbContextFactory<TechnologiesContext>((provider, options) =>
            {
                options.UseSqlServer(
                    configuration.GetConnectionString("Edm"),
                    sqlOptions => sqlOptions.UseCompatibilityLevel(140));
                var loggerFactory = provider.GetRequiredService<ILoggerFactory>();
                options.UseLoggerFactory(loggerFactory);
            }, poolSize: 16);

            services.AddAutoMapper(typeof(TechnologiesUiPlugin));

            services.AddScoped<IRemoteJobs, RemoteJobs>();
            services.AddScoped<IAuditService, AuditService>();
            services.AddScoped<IProcessService, ProcessService>();
            services.AddScoped<IHierarchyService, HierarchyService>();
            services.AddScoped<IHostService, HostService>();
            services.AddScoped<IDeviceService, DeviceService>();
            services.AddScoped<IWorkplaceService, WorkplaceService>();
            services.AddScoped<IProfileService, ProfileService>();
            services.AddScoped<IOperationService, OperationService>();
            services.AddScoped<ISettingService, SettingService>();

            services.AddScoped<ISensorService, SensorService>();
        }
    }
}

