using System;

namespace Optosense.Edm.Webui.Models
{
    public class HostDeviceModel
    {
        public int Id { get; set; }
        public int HostId { get; set; }
        public int DeviceId { get; set; }

        public string HostName { get; set; }
        public string HostUrl { get; set; }
        public string HostPort { get; set; }
        public string DeviceName { get; set; }
        public string DeviceModel { get; set; }
        public string DeviceEnvType { get; set; }
    }
}
