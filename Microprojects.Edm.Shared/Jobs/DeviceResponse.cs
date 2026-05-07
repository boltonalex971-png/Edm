using System;
using System.Collections.Generic;
using Microprojects.Edm.Drivers;

namespace Microprojects.Edm.Jobs
{
    public class DeviceResponse 
    {
        public int OperationHostDeviceId { get; set; }
        public DateTime ScheduledAt { get; set; }
        public DateTime ExecutedAt { get; set; }
        public string Parameters { get; set; }
        public string /*byte[]*/ Request { get; set; }
        public string /*byte[]*/ Response { get; set; }
        public string Info { get; set; }
        public DriverResponseState Status { get; set; }
        public bool IsValid { get; set; }
        public string Message { get; set; }
    }
}
