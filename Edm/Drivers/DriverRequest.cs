using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Drivers
{
    public class DriverRequest
    {
        /// <summary>
        /// Offset from operation start
        /// </summary>
        public long Offset { get; set; }
        public string Command { get; set; }
        public string Parameters { get; set; }
    }
}
