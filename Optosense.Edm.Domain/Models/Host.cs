using System;
using System.Collections.Generic;

namespace Optosense.Edm.Domain.Models
{
    public class Host : TypeObject
    {
        public string Url { get; set; }
        public int Port { get; set; }

        public ICollection<HostDevice> Devices { get; set; }
    }
}
