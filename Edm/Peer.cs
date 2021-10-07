using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm
{
    public class Peer
    {
        public string Host { get; set; }
        public int UiPort { get; set; }
        public int GrpcPort { get; set; }
        public string Version { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
