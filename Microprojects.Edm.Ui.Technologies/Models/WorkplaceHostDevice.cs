using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    /// <summary>
    /// Defines a working place with devices allowed to be used in processes, allowed for the workplace.
    /// </summary>
    public class WorkplaceHostDevice : LegacyIntDomainObject
    {
        public Guid WorkplaceId { get; set; }
        public Workplace Workplace { get; set; }
        public int HostDeviceId { get; set; }
        public HostDevice HostDevice { get; set; }
    }
}
