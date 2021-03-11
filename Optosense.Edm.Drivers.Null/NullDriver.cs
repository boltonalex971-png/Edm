using Optosense.Edm.Plugins;
using Optosense.Edm.Domain.Models;
using System;
using Microprojects.Edm.Drivers;
using System.Collections.Generic;
using System.Linq;

namespace Optosense.Edm.Drivers.Null
{
    [DriverPlugin(
        Guid = "{ABC4FDD6-E58D-4CEA-96D9-20EAAB6B99CA}",
        Name = "Null", 
        Description = "Just do nothing",
        SpaPath = "ui/build", 
        UiRoot = "driver")]
    public class NullDriver : DriverPluginBase
    {
        public override IDeviceDriver GetDriver() => new DriverBase();

        public override IEnumerable<DriverRequest> GetPlan(string profile, string parameters) => Enumerable.Empty<DriverRequest>();
    }
}
