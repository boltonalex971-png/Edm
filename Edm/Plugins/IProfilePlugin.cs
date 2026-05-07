using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Plugins
{
    public interface IProfilePlugin : IPlugin
    {
        IEnumerable<string> GetParameters(string profileJson);
    }
}
