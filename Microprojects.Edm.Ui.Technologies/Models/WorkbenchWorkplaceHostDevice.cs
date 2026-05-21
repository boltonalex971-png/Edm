using Microprojects.Edm.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class WorkbenchWorkplaceHostDevice : LegacyIntDomainObject
    {
        public int WorkbenchId { get; set; }
        public int WorkplaceHostDeviceId { get; set; }
        public int ProfileId { get; set; }

        public string Configuration { get; set; }

        public Workbench Workbench { get; set; }
        public WorkplaceHostDevice WorkplaceHostDevice { get; set; }
        public Profile Profile { get; set; }
    }
}
