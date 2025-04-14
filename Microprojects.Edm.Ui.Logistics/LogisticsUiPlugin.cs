using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Text;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microprojects.Edm.Ui.Logistics.Services;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics
{
    [OperationPlugin(
        Name = "Logistics",
        Description = "Product Logistics UI",
        Guid = "05D4D838-86C7-4488-814E-7FDE19049125",
        SpaPath = "Ui/dist",
        UiRoot = "logistics")]
    public class LogisticsUiPlugin : PluginBase, IOperationPlugin
    {
        public override void InjectDependencies(IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContextPool<LogisticsContext>((provider, options) =>
            {
                options.UseSqlServer(
                    configuration.GetConnectionString("Logistics"),
                    sqlOptions => sqlOptions
                        .UseCompatibilityLevel(140)); // This is workaround for EF 8 and "Contains" problem
                var loggerFactory = provider.GetRequiredService<ILoggerFactory>();
                options.UseLoggerFactory(loggerFactory);
            }, poolSize: 128);

            services.AddScoped<IDirectoryService, DirectoryService>();
            services.AddScoped<IProcessService, ProcessService>();
        }
    }
}
