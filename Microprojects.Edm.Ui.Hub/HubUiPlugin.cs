using Microprojects.Edm.Plugins;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Microprojects.Edm.Ui.Hub
{
    [ApplicationPlugin(
        Name = "Hub",
        Description = "Platform landing — module catalog with an at-a-glance promo for each loaded application.",
        NameKey = "Hub.name",
        DescriptionKey = "Hub.description",
        Guid = PluginGuid,
        SpaPath = "Ui/dist")]
    // UiRoot intentionally omitted -> null -> mounted at "/" by PluginManagerHelper.MapSpa.
    public class HubUiPlugin : PluginBase
    {
        public const string PluginGuid = "D2A92EF1-7B46-4956-859D-D48AA999385C";

        public override void InjectDependencies(IServiceCollection services, IConfiguration configuration)
        {
        }
    }
}
