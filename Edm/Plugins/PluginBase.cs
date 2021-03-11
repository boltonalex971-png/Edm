using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Plugins
{
    public class PluginBase : IPlugin
    {
        protected PluginAttribute pluginAttribute => (PluginAttribute) Attribute.GetCustomAttribute(GetType(), typeof(PluginAttribute));
        public Guid Guid { get => new Guid(pluginAttribute?.Guid ?? Guid.Empty.ToString()); }
        public string Name { get => pluginAttribute?.Name; }
        public string Description { get => pluginAttribute?.Description; }
        public string Homepage 
        { 
            get
            {
                var name = GetType().Namespace;
                var packageName = name.Substring(name.LastIndexOf('.') + 1);
                var homepage = $"/{pluginAttribute.UiRoot}/{packageName.ToLower(CultureInfo.CurrentCulture)}";
                return homepage;
            }
        }
    }
}
