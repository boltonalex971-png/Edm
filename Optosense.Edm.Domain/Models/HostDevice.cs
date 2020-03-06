
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class HostDevice : DomainObject
    {
        public int DeviceId { get; set; }
        public int HostId { get; set; }

        public string Parameters { get; set; }
        public bool IsActive { get; set; } = true;

        public Host Host { get; set; }
        public Device Device { get; set; }
    }
}
