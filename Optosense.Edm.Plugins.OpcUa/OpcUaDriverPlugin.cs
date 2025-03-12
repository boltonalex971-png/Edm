using Optosense.Edm.Plugins;
using System;
using Microprojects.Edm.Drivers;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace Optosense.Edm.Drivers.OpcUa
{
    [DriverPlugin(
        Guid = "025E6E6A-42C0-4FB6-B4FB-3FB8D2BC385F",
        Profile = "B3021B04-275F-4C1F-A6D6-3827D2F32A2E", // Environment profile
        Name = "OPC UA",
        Description = "OPC UA driver allowes to connect and get required data from any OPC UA servers",
        SpaPath = "ui-driver/build",
        UiRoot = "drivers/opcua")]
    public class OpcUaDriverPlugin : DriverPluginBase
    {
        public override IDeviceDriver GetDriver() => new OpcUaDriver(new OpcUaDriverOptions());

        public override IEnumerable<DriverRequest> GetPlan(string profileJson, string parameters)
        {

            IEnumerable<DriverRequest> plan = profileJson == null ?
                new List<DriverRequest>
                {
                    new() { Condition = "0", Command="Start" },
                    new() { Condition = "OperationCompleted", Command="Stop" }
                } : JsonConvert.DeserializeObject<IEnumerable<DriverRequest>>(profileJson);

            return plan;
        }
    }
}
