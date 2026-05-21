using System;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class WorkplaceHostDeviceModel
    {
        public Guid Id { get; set; }
        public Guid WorkplaceId { get; set; }
        public Guid HostDeviceId { get; set; }
        public Guid HostId { get; set; }
        public Guid DeviceId { get; set; }

        public string Host { get; set; }
        public string Url { get; set; }
        public string Device { get; set; }
        public string DriverName { get; set; }
        public Guid DriverGuid { get; set; }
        public string DriverHomepage { get; set; }
        public string ProfilerName { get; set; }
        public Guid ProfilerGuid { get; set; }
    }
}
