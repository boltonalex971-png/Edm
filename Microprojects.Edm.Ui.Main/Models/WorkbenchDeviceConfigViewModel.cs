using Optosense.Edm.Domain.Models;
using System;

namespace Microprojects.Edm.Ui.Main.Models
{
    public class WorkbenchDeviceConfigViewModel
    {
        public int Id { get; set; }
        public int WorkbenchId { get; set; }
        public int WorkplaceHostDeviceId { get; set; }
        public int ProfileId { get; set; }
        public int DeviceId { get; set; }
        public string ProfileOutput { get; set; }
        public string DeviceName { get; set; }
        public string HostName { get; set; }
        public string Configuration { get; set; }
        public string DriverName { get; set; }
        public Guid DriverGuid { get; set; }
        public string ProfilerName { get; set; }
        public Guid ProfilerGuid { get; set; }
        public string DriverHomepage { get; set; }
        public string ProfilerHomepage { get; set; }
    }
}
