using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class HostDevice : DomainObject
    {
        public Guid DeviceId { get; set; }
        public Guid HostId { get; set; }

        public string Parameters { get; set; }
        public bool IsActive { get; set; } = true;

        public Host Host { get; set; }
        public Device Device { get; set; }
    }
}
