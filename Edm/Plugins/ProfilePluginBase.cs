using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Plugins
{
    public abstract class ProfilePluginBase : PluginBase, IProfilePlugin
    {
        public abstract IEnumerable<string> GetParameters(string profileJson);
    }
}
