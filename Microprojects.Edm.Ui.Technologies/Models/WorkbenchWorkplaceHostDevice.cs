using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class WorkbenchWorkplaceHostDevice : LegacyIntDomainObject
    {
        public int WorkbenchId { get; set; }
        public int WorkplaceHostDeviceId { get; set; }
        public Guid ProfileId { get; set; }

        public string Configuration { get; set; }

        public Workbench Workbench { get; set; }
        public WorkplaceHostDevice WorkplaceHostDevice { get; set; }
        public Profile Profile { get; set; }
    }
}
