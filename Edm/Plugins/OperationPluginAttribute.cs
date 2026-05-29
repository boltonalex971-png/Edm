using System;
using System.Collections.Generic;
using System.Text;

namespace Microprojects.Edm.Plugins
{
    [AttributeUsage(AttributeTargets.Class)]
    public class OperationPluginAttribute : PluginAttribute
    {
        // True when the operation stamps a per-cell key (Record.Parameters["ADDR"])
        // so audits resolve per fixture cell. Gates PerCell mode in techno-process linking.
        public bool IsCellAware { get; set; }
    }
}
