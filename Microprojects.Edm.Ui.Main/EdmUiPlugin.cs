using Microprojects.Edm.Cache;
using Microprojects.Edm.Cache.Redis;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Infrastructure;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Core.Services;
using Optosense.Edm.DataAccess;
using Optosense.Edm.Infrastructure.Edm;
using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Text;

namespace Optosense.Edm.WebUi
{
    [OperationPlugin(
        Name = "EDM",
        Description = "Main EDM UI",
        Guid = "76123DAA-9A68-4F90-B6A9-F5F16633C7D6",
        SpaPath = "ClientApp/build")]
    public class EdmUiPlugin : PluginBase, IOperationPlugin
    {
        public override void InjectDependencies(IServiceCollection services, IConfiguration configuration)
        {
            //services.AddSingleton<ICache>(new RedisCache(configuration["Edm:Cache:Default:ConnectionString"]));
            services.AddDbContext<EdmContext>(options =>
            {
                options.UseSqlServer(configuration.GetConnectionString("Edm"));
            });

            services.AddSingleton<IEdmContextFactory>(new EdmContextFactory(configuration.GetConnectionString("Edm")));
            services.AddScoped<IEdmContext>(provider => provider.GetService<EdmContext>());
            services.AddTransient<IOwnedEdmContext>(provider => provider.GetService<EdmContext>());

            services.AddTransient<IRemoteCommands, RemoteCommands>();

            services.AddTransient<IAuditService, AuditService>();
            services.AddTransient<IProcessService, ProcessService>();
            services.AddTransient<IHierarchyService, HierarchyService>();
            services.AddTransient<IHostService, HostService>();
            services.AddTransient<IDeviceService, DeviceService>();
            services.AddTransient<IWorkplaceService, WorkplaceService>();
            services.AddTransient<IProfileService, ProfileService>();
            services.AddTransient<IOperationService, OperationService>();
            services.AddTransient<ISettingService, SettingService>();
        }
    }
}
