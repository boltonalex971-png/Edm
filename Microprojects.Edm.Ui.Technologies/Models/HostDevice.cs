using Optosense.Edm.Domain.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
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
