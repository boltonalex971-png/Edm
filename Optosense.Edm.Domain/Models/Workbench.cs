using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Workbench : TypeObject
    {
        public int WorkplaceProcessId { get; set; }
        public WorkplaceProcess WorkplaceProcess { get; set; }
        public ICollection<WorkbenchWorkplaceHostDevice> DeviceConfigurations { get; set; } = new HashSet<WorkbenchWorkplaceHostDevice>();
    }
}
