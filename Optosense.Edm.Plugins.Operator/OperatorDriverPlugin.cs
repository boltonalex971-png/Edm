using Optosense.Edm.Plugins;
using Optosense.Edm.Domain.Models;
using System;
using Microprojects.Edm.Drivers;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Optosense.Edm.Profiles.Operator;

namespace Optosense.Edm.Drivers.Operator
{
    [DriverPlugin(
        Guid = "{F222F3FA-0C13-4AE1-9B2D-CB055D4B9679}",
        Name = "Operator",
        Description = "Operator driver allowes to substitute any devices with a human hand input",
        SpaPath = "ui-driver/build",
        UiRoot = "drivers/operator")]
    public class OperatorDriverPlugin : DriverPluginBase
    {
        public override IDeviceDriver GetDriver() => new OperatorDriver();

        public override IEnumerable<DriverRequest> GetPlan(string profileJson, string parameters)
        {
            var profile = JsonConvert.DeserializeObject<OperatorProfile>(profileJson);
            return profile
                .OrderBy(p => p.Order)
                .Select((p, i) => new DriverRequest
                {
                    Command = p.Action.ToString(),
                    Condition = p.Condition,
                    Parameters = JsonConvert.SerializeObject(p)
                }).ToList();
        }
    }
}
