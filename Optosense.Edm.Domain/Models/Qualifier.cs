using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Qualifier : TypeObject
    {
        public int ProcessId {  get; set; } 

        public Process Process { get; set; }
    }
}
