using System;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class HostDeviceModel
    {
        public int Id { get; set; }
        public Guid HostId { get; set; }
        public Guid DeviceId { get; set; }

        public string HostName { get; set; }
        public string HostUrl { get; set; }
        public string HostPort { get; set; }
        public string DeviceName { get; set; }
        public string DriverName { get; set; }
        public Guid DriverGuid { get; set; }
        public string DriverHomepage { get; set; }
        public string ProfilerName { get; set; }
        public Guid ProfilerGuid { get; set; }
    }
}
