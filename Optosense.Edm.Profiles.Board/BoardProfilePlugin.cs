using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Profiles.Board
{
    [ProfilePlugin(
        Guid = "8E33F54D-D817-44C4-B2ED-1F8FD957CCD6",
        Name = "Board", 
        SpaPath = "Ui/build",
        UiRoot = "profiles")]
    public class BoardProfilePlugin : ProfilePluginBase
    {
        private const string INSTRUCTION_SETTING = "instructions";

        public Type GetSettingType(string name)
        {
            var result = name switch
            {
                "instructions" => typeof(IEnumerable<Instruction>),
                _ => throw new ArgumentException("No such setting")
            };
            return result;
        }
    }
}
