using Microprojects.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Text;

namespace Optosense.Edm.Operations.Test
{
    [OperationPlugin(
        Name = "General",
        Description = "Using for general testing purpose",
        Guid = "0741B118-5659-4727-9948-EFA885D0577D",
        SpaPath = "ui/build",
        UiRoot = "apps/test")]
    public class TestOperationPlugin : PluginBase, IOperationPlugin
    {
    }
}
