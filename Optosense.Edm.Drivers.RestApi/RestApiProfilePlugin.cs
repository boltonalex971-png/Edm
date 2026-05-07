using Newtonsoft.Json;
using Microprojects.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Optosense.Edm.Drivers.RestApi
{
    [ProfilePlugin(
        Guid = "82F37B83-86F6-4ABB-87BC-E48F5FEB0D37",
        Name = "RestApi", 
        SpaPath = "ui-profile",
        UiRoot = "profiles/restapi")]
    public class RestApiProfilePlugin : ProfilePluginBase
    {
        public override IEnumerable<string> GetParameters(string profileJson)
        {
            return Enumerable.Empty<string>();
        }

    }
}
