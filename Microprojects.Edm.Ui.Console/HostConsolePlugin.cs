using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microprojects.Edm.Ui.Console
{
    [OperationPlugin(
        Name = "Host Console",
        Description = "Info about available or running tasks, drivers and logs on the host",
        Guid = "D765CE7A-F2FB-4A93-83C5-1C7CDF060116",
        SpaPath = "ui/build",
        UiRoot = "console")]
    public class HostConsolePlugin : PluginBase, IOperationPlugin
    {
        public override void InjectDependencies(IServiceCollection services, IConfiguration configuration)
        {
        }
    }
}
