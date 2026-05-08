using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microprojects.Edm.Plugins;

namespace Microprojects.Edm.Ui.Console
{
    [ApplicationPlugin(
        Name = "Host Console",
        Description = "Live host operations — tasks, drivers, plugin health and log streams from the host process.",
        Guid = "D765CE7A-F2FB-4A93-83C5-1C7CDF060116",
        SpaPath = "Ui/dist",
        UiRoot = "console")]
    public class HostConsolePlugin : PluginBase, IOperationPlugin
    {
        public override void InjectDependencies(IServiceCollection services, IConfiguration configuration)
        {
        }
    }
}
