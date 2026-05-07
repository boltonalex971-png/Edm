using Newtonsoft.Json;
using Microprojects.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Optosense.Edm.Profiles.Enviromnent
{
    [ProfilePlugin(
        Guid = "B3021B04-275F-4C1F-A6D6-3827D2F32A2E",
        Name = "Environment", 
        SpaPath = "ui-profile/build",
        UiRoot = "profiles/environment")]
    public class EnvironmentProfilePlugin : ProfilePluginBase
    {
        public override IEnumerable<string> GetParameters(string profileJson)
        {
            return Enumerable.Empty<string>();
        }

    }
}
