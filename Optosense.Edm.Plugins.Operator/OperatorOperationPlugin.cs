using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Text;

namespace Optosense.Edm.Operations.Test
{
    [OperationPlugin(
        Name = "Operator",
        Description = "Reference operator user interface",
        Guid = "BAADBE6E-3EEB-4A51-8205-35EA2F920473",
        SpaPath = "ui/build",
        UiRoot = "apps/operator")]
    public class OperatorOperationPlugin : PluginBase, IOperationPlugin
    {
    }
}
