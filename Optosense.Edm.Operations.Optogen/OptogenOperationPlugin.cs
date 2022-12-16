using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Text;

namespace Optosense.Edm.Operations.Optogen
{
    [OperationPlugin(
        Name = "Optogen",
        Description = "General operator's UI of Optosense",
        Guid = "{7E8C3FD3-D4A0-4F86-A9FF-A9E9E6AC77D8}",
        SpaPath = "ui/build",
        UiRoot = "apps/optogen")]
    public class OptogenOperationPlugin : PluginBase, IOperationPlugin
    {
    }
}
