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
        
        /// <summary>
        /// If the field is number literal it's considered as an offset from now in milliseconds, 
        /// otherwise the sting is representing a boolean property or boolean expression
        /// </summary>
        public string Condition { get; set; }
        public string Command { get; set; }
        public string Parameters { get; set; }
    }

    public static partial class DriverRequests
    {
        public static DriverRequest Stop { get; } = new() { Command = "Stop" };
        public static DriverRequest Start { get; } = new() { Command = "Start" };
    }
}
