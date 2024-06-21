using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Plugins
{
    public class PluginManager : IPluginContainer
    {
        private IEnumerable<IPlugin> Plugins { get; set; }

        public PluginManager(IEnumerable<IPlugin> plugins)
        {
            Plugins = plugins;
        }

        public IPlugin GetPlugin(Guid guid) => Plugins.FirstOrDefault(p => p.Guid == guid);

        public IEnumerable<IPlugin> GetAllPlugins()
        {
            return Plugins;
        }

        public IDriverPlugin GetDriver(Guid guid) => GetDrivers().FirstOrDefault(p => p.Guid == guid);

        public IEnumerable<IDriverPlugin> GetDrivers()
        {
            var result = Plugins
                .Where(p => typeof(IDriverPlugin).IsAssignableFrom(p.GetType()))
                .Cast<IDriverPlugin>()
                .ToList();
            return result;
        }

        IOperationPlugin IPluginContainer.GetMonitor(Guid guid) => GetOperations().FirstOrDefault(p => p.Guid == guid);

        public IEnumerable<IOperationPlugin> GetOperations()
        {
            var result = Plugins
                .Where(p => typeof(IOperationPlugin).IsAssignableFrom(p.GetType()))
                .Cast<IOperationPlugin>()
                .ToList();
            return result;
        }

        public IProfilePlugin GetProfile(Guid guid) => GetProfiles().FirstOrDefault(p => p.Guid == guid);

        IEnumerable<IDriverPlugin> IPluginContainer.GetProfileDrivers(Guid profileGuid)
        {
            throw new NotImplementedException();
        }

        public IEnumerable<IProfilePlugin> GetProfiles()
        {
            var result = Plugins
                .Where(p => typeof(IProfilePlugin).IsAssignableFrom(p.GetType()))
                .Cast<IProfilePlugin>()
                .ToList();
            return result;
        }

        public IProfilePlugin GetProfileByDriver(Guid driverGuid) => GetProfile(GetDriver(driverGuid)?.ProfileGuid ?? Guid.Empty);
    }
}
