using System;

namespace Microprojects.Edm.Ui.Main.Models
{
    public class WorkplaceHostDeviceModel
    {
        public int Id { get; set; }
        public int WorkplaceId { get; set; }
        public int HostDeviceId { get; set; }
        public int HostId { get; set; }
        public int DeviceId { get; set; }

        public string Host { get; set; }
        public string Url { get; set; }
        public string Device { get; set; }
        public string DriverName { get; set; }
        public Guid DriverGuid { get; set; }
        public string ProfilerName { get; set; }
        public Guid ProfilerGuid { get; set; }
    }
}
