using System.Collections.Generic;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Workbench : DomainObject, IWithMeta
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int WorkplaceProcessId { get; set; }
        public string CommonUid { get; set; }

        public WorkplaceProcess WorkplaceProcess { get; set; }
        public ICollection<WorkbenchWorkplaceHostDevice> DeviceConfigurations { get; set; } = new HashSet<WorkbenchWorkplaceHostDevice>();

        public Meta Meta { get; set; } = null!;
    }
}
