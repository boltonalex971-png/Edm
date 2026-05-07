using Microprojects.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Text;

namespace Optosense.Edm.Operations.TypeOne
{
    [OperationPlugin(
        Name = "Type One",
        Description = "Check sensor current consumption",
        Guid = "{8A00F2CD-CBA9-4A17-9B5E-2447B4ABFB14}",
        SpaPath = "TypeOneUi/build",
        UiRoot = "apps/typeone")]
    public class TypeOneOperationPlugin : PluginBase, IOperationPlugin
    {
    }
}
