using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    /// <summary>
    /// Defines a working place with devices allowed to be used in processes, allowed for the workplace.
    /// </summary>
    public class WorkplaceHostDevice: DomainObject
    {
        public int WorkplaceId { get; set; }
        public Workplace Workplace { get; set; }
        public int HostDeviceId { get; set; }
        public HostDevice HostDevice { get; set; }
    }
}
