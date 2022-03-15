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
using Optosense.Edm.Jobs;
using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microprojects.Edm.Ui.Main
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
        }
    }
}
