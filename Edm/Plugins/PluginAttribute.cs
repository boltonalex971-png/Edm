using System;
using System.Collections.Generic;
using System.Text;

namespace Optosense.Edm.Plugins
{
    [AttributeUsage(AttributeTargets.Class)]
    public class PluginAttribute : Attribute
    {
        public string SpaPath { get; set; }
        public string UiRoot { get; set; }
        public string Guid { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
    }
}
