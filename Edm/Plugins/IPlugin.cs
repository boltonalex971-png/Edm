using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Plugins
{
    public interface IPlugin
    {
        Guid Guid { get; }
        string Name { get; }
        string Description { get; }
        string Homepage { get; }
        void InjectDependencies(IServiceCollection services, IConfiguration configuration);
    }
}
