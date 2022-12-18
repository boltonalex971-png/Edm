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
        /// If the field is number literal it's considered as an offset from now in seconds, 
        /// otherwise the sting is representing a boolean property or boolean expression
        /// </summary>
        public string Condition { get; set; }
        /// <summary>
        /// The command can be any string which a device driver can understand. The drivers inherited from
        /// <code>Microprojects.Edm.Drivers.DriverBase</code> use "Init", "Start", "Get", "Set", "Ping" and "Stop"
        /// commands.
        /// </summary>
        public string Command { get; set; }
        /// <summary>
        /// Parameters can be anything that a driver requires to execute the command. Usually, 
        /// it is a stringified JSON object or constant literal.
        /// </summary>
        public string Parameters { get; set; }
        /// <summary>
        /// Specifies the interval in seconds to repeat the command until condition is met.
        /// </summary>
        public int? Repeat { get; set; }
        /// <summary>
        /// Condition to be met to stop the command repeating. Can be a numeric literal, meaning the interval in seconds, 
        /// or a boolean condition, like <code>System.Linq.Expression</code>. 
        /// </summary>
        public string Until { get; set; }
    }

    public static partial class DriverRequests
    {
        public static DriverRequest Stop { get; } = new() { Command = "Stop" };
        public static DriverRequest Start { get; } = new() { Command = "Start" };
    }
}
