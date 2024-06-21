using System;
using System.Collections.Generic;

namespace Optosense.Edm.Domain.Models
{
    public class Host : HierarchyObject
    {
        public override HierarchyType HierarchyType => HierarchyType.Host;

        public string Url { get; set; }
        public int Port { get; set; }

        public ICollection<HostDevice> Devices { get; set; }
    }
}
