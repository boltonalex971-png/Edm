using Microprojects.Edm.Drivers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Optosense.Edm.Plugins
{
    public interface IDriverPlugin : IPlugin
    {
        Guid ProfileGuid { get; }
        [Obsolete("Use GetDriver(DeviceParameters parameters) instead")]
        IDeviceDriver GetDriver();
        IDeviceDriver GetDriver(DeviceParameters parameters);
        // TODO execution plan must be created by profile plugin as it should know the format of profile
        IEnumerable<DriverRequest> GetPlan(string profile, string parameters);
    }

    public interface IAsyncPlanProvider : IDriverPlugin
    {
        IAsyncEnumerable<DriverRequest> GetAsyncPlan(string profile, string parameters, DateTime startedAt);
    }
}
