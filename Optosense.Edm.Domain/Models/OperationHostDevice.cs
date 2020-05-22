using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class OperationHostDevice : DomainObject
    {
        public int OperationId { get; set; }
        public int HostDeviceId { get; set; }
        public int ProfileId { get; set; }
        public string Options { get; set; }

        public virtual Operation Operation { get; set; }
        public virtual HostDevice HostDevice { get; set; }
        public virtual Profile Profile { get; set; }
    }
}
