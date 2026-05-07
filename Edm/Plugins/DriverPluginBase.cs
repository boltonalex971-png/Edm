using Microprojects.Edm.Drivers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Plugins
{
    public abstract class DriverPluginBase : PluginBase, IDriverPlugin 
    {
        public Guid ProfileGuid 
        { 
            get => new Guid(((DriverPluginAttribute) pluginAttribute)?.Profile ?? Guid.Empty.ToString()); 
        }

        public abstract IDeviceDriver GetDriver();
        public virtual IDeviceDriver GetDriver(DeviceParameters parameters) => GetDriver();
        public abstract IEnumerable<DriverRequest> GetPlan(string profile, string parameters);
    }
}
