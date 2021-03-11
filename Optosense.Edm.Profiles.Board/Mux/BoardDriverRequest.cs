using Microprojects.Edm.Drivers;
using Optosense.Edm.Profiles.Board;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Drivers.Mux
{
    public class BoardDriverRequest : DriverRequest
    {
        public Instruction Instruction { get; set; }
    }

}
