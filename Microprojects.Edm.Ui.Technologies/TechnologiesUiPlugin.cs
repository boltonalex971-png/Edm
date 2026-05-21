using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Infrastructure;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Jobs;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microprojects.Edm.Ui.Technologies.Services;

namespace Microprojects.Edm.Ui.Technologies
{
    [ApplicationPlugin(
        Name = "Technologies",
        Description = "Manufacturing process tree — profiles, devices, hosts and routings authored once and consumed across the platform.",
        NameKey = "Technologies.name",
        DescriptionKey = "Technologies.description",
        Guid = "76123DAA-9A68-4F90-B6A9-F5F16633C7D6",
        SpaPath = "Ui/dist",
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

            services.AddScoped<IRemoteJobs, RemoteJobs>();
            services.AddScoped<IAuditService, AuditService>();
            services.AddScoped<IProcessService, ProcessService>();
            services.AddScoped<IUserService, UserService>();
            // Plugin-specific registry registered as IPluginDirectoryRootRegistry
            // (so it accumulates alongside Logistics's). The host resolves
            // IDirectoryRootRegistry via the shared CompositeDirectoryRootRegistry
            // below — TryAddScoped because both plugins request it; the first
            // registration sticks and the rest are no-ops.
            services.AddScoped<IPluginDirectoryRootRegistry, TechDirectoryRootRegistry>();
            services.TryAddScoped<IDirectoryRootRegistry, CompositeDirectoryRootRegistry>();
            services.AddScoped<IDirectoryService, DirectoryService<TechnologiesContext>>();
            services.AddScoped<IHostService, HostService>();
            services.AddScoped<IDeviceService, DeviceService>();
            services.AddScoped<IWorkplaceService, WorkplaceService>();
            services.AddScoped<IProfileService, ProfileService>();
            services.AddScoped<IQualifierService, QualifierService>();
            services.AddScoped<IOperationService, OperationService>();
            services.AddScoped<ISettingService, SettingService>();

            services.AddScoped<ISensorService, SensorService>();
        }
    }
}

