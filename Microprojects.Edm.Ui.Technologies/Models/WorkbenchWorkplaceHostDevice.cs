using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class WorkbenchWorkplaceHostDevice : DomainObject
    {
        public Guid WorkbenchId { get; set; }
        public Guid WorkplaceHostDeviceId { get; set; }
        public Guid ProfileId { get; set; }

        public string Configuration { get; set; }

        public Workbench Workbench { get; set; }
        public WorkplaceHostDevice WorkplaceHostDevice { get; set; }
        public Profile Profile { get; set; }
    }
}
