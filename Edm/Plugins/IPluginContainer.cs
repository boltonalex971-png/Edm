using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Plugins
{
    public interface IPluginContainer
    {
        IPlugin GetPlugin(Guid guid);
        IEnumerable<IPlugin> GetAllPlugins();
        IDriverPlugin GetDriver(Guid guid);
        IEnumerable<IDriverPlugin> GetDrivers();
        IEnumerable<IDriverPlugin> GetProfileDrivers(Guid profileGuid);
        IOperationPlugin GetMonitor(Guid guid);
        IEnumerable<IOperationPlugin> GetOperations();
        IProfilePlugin GetProfile(Guid guid);
        IProfilePlugin GetProfileByDriver(Guid driverGuid);
        IEnumerable<IProfilePlugin> GetProfiles();
    }
}
