using Microprojects.Edm.Plugins;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Events;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microprojects.Edm.Ui.Logistics.Services;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics
{
    [ApplicationPlugin(
        Name = "Logistics",
        Description = "Product flow from supply to finished item: nomenclature, tare, items, orders, batch genealogy and the operator desktop.",
        NameKey = "Logistics.name",
        DescriptionKey = "Logistics.description",
        Guid = "05D4D838-86C7-4488-814E-7FDE19049125",
        SpaPath = "Ui/dist",
        UiRoot = "logistics")]
    public class LogisticsUiPlugin : PluginBase, IOperationPlugin
    {
        public override void InjectDependencies(IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IConnectionOrigin, HttpHeaderConnectionOrigin>();
            services.AddSingleton<LogisticsPublishingInterceptor>();

            services.AddDbContextPool<LogisticsContext>((provider, options) =>
            {
                options.UseSqlServer(
                    configuration.GetConnectionString("Logistics"),
                    sqlOptions => sqlOptions
                        .UseCompatibilityLevel(140)); // This is a workaround for EF 8 and "Contains" problem
                var loggerFactory = provider.GetRequiredService<ILoggerFactory>();
                options.UseLoggerFactory(loggerFactory);
                options.AddInterceptors(
                    provider.GetRequiredService<LogisticsPublishingInterceptor>());
            }, poolSize: 128);

            services.AddScoped<IDirectoryRootRegistry, LogisticsDirectoryRootRegistry>();
            services.AddScoped<IDirectoryService, DirectoryService<LogisticsContext>>();
            services.AddScoped<IItemService, ItemService>();
            services.AddScoped<ISupplyService, SupplyService>();
            services.AddScoped<INomenclatureService, NomenclatureService>();
            services.AddScoped<IOrderService, OrderService>();
            services.AddScoped<IProcessService, ProcessService>();
            services.AddScoped<ITareService, TareService>();
            services.AddScoped<ITareTypeService, TareTypeService>();
            services.AddScoped<ISpecificationService, SpecificationService>();
            services.AddScoped<ITechLinkService, TechLinkService>();
            // IUserService is root-tier — registered once by EdmHostBuilderExtensions.
        }
    }
}
