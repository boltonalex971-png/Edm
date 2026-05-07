using Newtonsoft.Json;
using Microprojects.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Optosense.Edm.Profiles.Operator
{
    [ProfilePlugin(
        Guid = "AD93FB8A-7EB9-480C-8BA4-538E7A8E1538",
        Name = "Operator", 
        SpaPath = "ui-profile/build",
        UiRoot = "profiles/operator")]
    public class OperatorProfilePlugin : ProfilePluginBase
    {
        public override IEnumerable<string> GetParameters(string profileJson)
        {
            var profile = JsonConvert.DeserializeObject<OperatorProfile>(profileJson ?? "{}");
            var parameters = profile
                .SelectMany(p => JsonConvert.DeserializeObject<IEnumerable<string>>(p.Parameters ?? "[]"))
                .Distinct(); 
            return parameters.Prepend("ResponseTime"); // TODO Use "Failures" audit fuction, remove this useless parameter
        }

    }
}
