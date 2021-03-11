using Microprojects.Edm.Drivers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Plugins
{
    public interface IDriverPlugin : IPlugin
    {
        Guid ProfileGuid { get; }
        IDeviceDriver GetDriver();
        IEnumerable<DriverRequest> GetPlan(string profile, string parameters);
    }
}
