using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Workbench : TypeObject
    {
        public int WorkplaceProcessId { get; set; }
        public string CommonUid { get; set; }

        public WorkplaceProcess WorkplaceProcess { get; set; }
        public ICollection<WorkbenchWorkplaceHostDevice> DeviceConfigurations { get; set; } = new HashSet<WorkbenchWorkplaceHostDevice>();
    }
}
