using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
        public virtual string Homepage { get => pluginAttribute?.UiRoot; }
        public virtual void InjectDependencies(IServiceCollection services, IConfiguration configuration)
        {
        }
    }
}
