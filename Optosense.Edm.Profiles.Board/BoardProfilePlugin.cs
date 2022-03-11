using Newtonsoft.Json;
using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Optosense.Edm.Profiles.Board
{
    [ProfilePlugin(
        Guid = "8E33F54D-D817-44C4-B2ED-1F8FD957CCD6",
        Name = "Board", 
        SpaPath = "Ui/build",
        UiRoot = "profiles/board")]
    public class BoardProfilePlugin : ProfilePluginBase
    {
        private const string INSTRUCTION_SETTING = "instructions";

        public Type GetSettingType(string name)
        {
            var result = name switch
            {
                INSTRUCTION_SETTING => typeof(IEnumerable<Instruction>),
                _ => throw new ArgumentException("No such setting")
            };
            return result;
        }

        public override IEnumerable<string> GetParameters(string profileJson)
        {
            var profile = JsonConvert.DeserializeObject<BoardProfile>(profileJson);
            var parameters = profile
                .SelectMany(c => c.Instructions
                    .SelectMany(i => Regex.Matches(i.Instruction?.Syntax ?? string.Empty, @"\?<(\w+?)>")
                        .Select(m => m.Groups[1].Value))
                    .Concat(c.Instructions
                        .SelectMany(i => Regex.Matches(i.Instruction?.Code ?? string.Empty, @"{(\w+?)}"))
                            .Select(m => m.Groups[1].Value)))
                .Distinct()
                .OrderBy(p => p)
                .ToList();
            return parameters;
        }

    }
}
