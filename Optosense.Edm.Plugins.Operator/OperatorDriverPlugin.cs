using Optosense.Edm.Plugins;
using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Optosense.Edm.Profiles.Operator;

namespace Optosense.Edm.Drivers.Operator
{
    [DriverPlugin(
        Guid = "{F222F3FA-0C13-4AE1-9B2D-CB055D4B9679}",
        Name = "Operator",
        Description = "Operator driver allows to substitute any devices with a human hand input",
        SpaPath = "ui-driver/build",
        UiRoot = "drivers/operator")]
    public class OperatorDriverPlugin : DriverPluginBase
    {
        public override IDeviceDriver GetDriver() => new OperatorDriver();
        public override IDeviceDriver GetDriver(DeviceParameters parameters) => new OperatorDriver(parameters);

        public override IEnumerable<DriverRequest> GetPlan(string profileJson, string parameters)
        {
            var profile = JsonConvert.DeserializeObject<OperatorProfile>(profileJson)?
                .OrderBy(p => p.Order)
                .ToList() ?? new OperatorProfile();

            for (int i = 0; i < profile.Count; i++)
            {
                var request = new DriverRequest
                {
                    Command = profile[i].Command,
                    // if previous step is repeatable, start this step write after the previous one completes
                    Condition =  i > 0 && profile[i - 1].Repeat != null ? "0" : profile[i].Condition,
                    Parameters = JsonConvert.SerializeObject(profile[i]),
                    Repeat = profile[i].Repeat,
                    // Take until condition from the next step or continue until operation stops
                    Until = i < profile.Count - 1 ? profile[i + 1].Condition : "Stop"
                };

                yield return request;
            }
        }

        public static Guid GetGuid() 
        {
            var attr = (DriverPluginAttribute)Attribute
                .GetCustomAttribute(typeof(OperatorDriverPlugin), typeof(DriverPluginAttribute));
            return new Guid(attr.Guid); 
        }
    }
}
