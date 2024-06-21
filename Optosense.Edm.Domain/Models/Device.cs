using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Device : HierarchyObject
    {
        public override HierarchyType HierarchyType => HierarchyType.Device;

        public string Parameters { get; set; }
        public Guid DriverGuid { get; set; }
        [NotMapped]
        public string DriverName { get; set; }
        [NotMapped]
        public Guid ProfilerGuid { get; set; }
        [NotMapped]
        public string ProfilerName { get; set; }

        public ICollection<HostDevice> Hosts { get; set; }
    }
}
