using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Microprojects.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Optosense.Edm.Drivers.RestApi
{
    [DriverPlugin(
        Guid = "F0BFA4BF-20C3-43B8-8984-F0E0E85B34F9",
        Profile = "82F37B83-86F6-4ABB-87BC-E48F5FEB0D37",
        Name = "RestApi", 
        Description = "Use REST API calls to get and set parameters",
        SpaPath = "ui-driver/dist", 
        UiRoot = "drivers/restapi")]
    public class RestApiDriverPlugin : DriverPluginBase
    {
        public override IDeviceDriver GetDriver() => new RestApiDriver();

        public override IEnumerable<DriverRequest> GetPlan(string profileJson, string parameters)
        {

            IEnumerable<DriverRequest> plan = string.IsNullOrEmpty(profileJson) ?
                new List<DriverRequest>
                {
                    new() { Condition = "0", Command="Start" },
                    new() { Condition = $"EverWait_{Random.Shared.NextInt64()}", Command="Nope" }
                } : JsonConvert.DeserializeObject<IEnumerable<DriverRequest>>(profileJson);

            return plan;
        }
    }
}
