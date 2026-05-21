using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Plugins
{
    public interface IPlugin
    {
        Guid Guid { get; }
        string Name { get; }
        string Description { get; }
        string Homepage { get; }
        /// <summary>Optional i18next key for the localized plugin name. See <see cref="PluginAttribute.NameKey"/>.</summary>
        string NameKey { get; }
        /// <summary>Optional i18next key for the localized plugin description. See <see cref="PluginAttribute.DescriptionKey"/>.</summary>
        string DescriptionKey { get; }
        void InjectDependencies(IServiceCollection services, IConfiguration configuration);
    }
}
