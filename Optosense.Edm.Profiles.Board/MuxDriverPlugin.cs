using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Microprojects.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace Optosense.Edm.Drivers.Mux
{
    [DriverPlugin(
        Guid = "91679408-5421-446A-955B-838291DA7502",
        Profile = "8E33F54D-D817-44C4-B2ED-1F8FD957CCD6",
        Name = "Mux board", 
        Description = "Controls 20-sockets MUX board",
        SpaPath = "MuxDriverUi/build", 
        UiRoot = "drivers/mux")]
    public class MuxDriverPlugin : DriverPluginBase,  IAsyncPlanProvider
    {
        public override IDeviceDriver GetDriver() => new BoardDriverBase();

        public override IEnumerable<DriverRequest> GetPlan(string profile, string parameters)
        {
            var gen = new BoardDriverPlanGenerator();
            var availableParams = JsonConvert.DeserializeObject<BoardDriverOptions>(parameters);
            var addr = JsonConvert.SerializeObject(
                Enumerable
                    .Range(0, availableParams.Capacity)
                    .Select(a => $"#{a:X2}")
            );
            var plan = gen.GetTestPlan(profile, $"{{ADDR: {addr}}}");
            return plan;
        }

        public IAsyncEnumerable<DriverRequest> GetAsyncPlan(string profile, string parameters, DateTime startedAt)
        {
            var gen = new BoardDriverPlanGenerator();
            var availableParams = JsonConvert.DeserializeObject<BoardDriverOptions>(parameters);
            var addr = JsonConvert.SerializeObject(
                Enumerable
                    .Range(0, availableParams.Capacity)
                    .Select(a => $"#{a:X2}")
            );
            var plan = gen.GetAsyncPlan(profile, $"{{ADDR: {addr}}}", startedAt);
            return plan;
        }
    }
}
