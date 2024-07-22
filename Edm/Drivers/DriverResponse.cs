using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Drivers
{
    public enum DriverResponseState
    {
        Ok = 0,
        InvalidResponse = 1,
        Failed = 2,
        Timeout = 3,
        NotCompleted = 4
    }

    public record DriverResponse
    {
        public long Planned { get; set; }
        public long Executed { get; set; }
        public string Request { get; set; }
        public string Response { get; set; }
        public string Parameters { get; set; }
        public DriverResponseState State { get; set; }
        public string Message { get; set; }
    }
}
