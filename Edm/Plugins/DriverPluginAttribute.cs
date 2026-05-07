using System;
using System.Collections.Generic;
using System.Text;

namespace Microprojects.Edm.Plugins
{
    [AttributeUsage(AttributeTargets.Class)]
    public class DriverPluginAttribute : PluginAttribute
    {
        /// <summary>
        /// Reference to corresponding profile editor plugin as GUID
        /// </summary>
        public string Profile { get; set; }
    }
}
