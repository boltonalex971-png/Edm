
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class ProcessProfile : DomainObject
    {
        public int ProcessId { get; set; }
        public int ProfileId { get; set; }

        public Process Process { get; set; }
        public Profile Profile { get; set; }
    }
}
