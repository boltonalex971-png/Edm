using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Exceptions
{
    public class SerialPortException : EdmException
    {
        public SerialPortException(Exception e) : base(e.Message, e) { }

        public SerialPortException(string message) : base(message) { }

        public string ExtendedMessage => $"Exception on {Port} command: '{Command}', [{nameof(Timeout)}: {Timeout}, {nameof(ResponseLength)}: {ResponseLength}, {nameof(SingleLine)}: {SingleLine}], result: '{Buffer}'. {Message}";

        public string Port { get; set; }
        public string Command { get; set; }
        public string Buffer { get; set; }
        public int Timeout { get; set; }
        public int ResponseLength { get; set; }
        public bool SingleLine { get; set; }
    }
}
