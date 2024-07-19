using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Optosense.Edm.Domain.Models
{
    public class Host : HierarchyObject
    {
        public override HierarchyType HierarchyType => HierarchyType.Host;

        public string Url { get; set; }
        public int Port { get; set; }
        [NotMapped]
        public string Version { get; set; }
        [NotMapped]
        public string Mode { get; set; }
        [NotMapped]
        public string Environment { get; set; }
        public ICollection<HostDevice> Devices { get; set; }
    }
}
