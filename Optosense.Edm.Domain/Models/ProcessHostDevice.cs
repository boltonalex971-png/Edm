using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class ProcessHostDevice : DomainObject
    {
        public int ProcessId { get; set; }
        public int HostDeviceId { get; set; }
        public int ProfileId { get; set; }
        public string Options { get; set; }

        public virtual Process Process { get; set; }
        public virtual HostDevice HostDevice { get; set; }
        public virtual Profile Profile { get; set; }
    }
}
