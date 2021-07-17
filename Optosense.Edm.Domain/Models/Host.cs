using System;
using System.Collections.Generic;

namespace Optosense.Edm.Domain.Models
{
    public class Host : TypeObject, IHierarchyObject
    {
        public HierarchyType HierarchyType => HierarchyType.Host;
        public int HierarchyId { get; set; }

        public string Url { get; set; }
        public int Port { get; set; }

        public Hierarchy Hierarchy { get; set; }
        public ICollection<HostDevice> Devices { get; set; }
    }
}
