using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class OperationHostDevice : DomainObject
    {
        public Guid OperationId { get; set; }
        public int HostDeviceId { get; set; }
        public Guid ProfileId { get; set; }
        public string Options { get; set; }

        public virtual Operation Operation { get; set; }
        public virtual HostDevice HostDevice { get; set; }
        public virtual Profile Profile { get; set; }
    }
}
