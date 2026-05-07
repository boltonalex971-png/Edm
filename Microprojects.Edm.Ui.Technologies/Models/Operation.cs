using Microprojects.Edm.Domain;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Operation : TypeObject
    {
        public int? WorkbenchId { get; set; }
        public int? WorkplaceProcessId { get; set; }
        public DateTime Created { get; set; } = DateTime.UtcNow;
        public DateTime? Scheduled { get; set; }
        public DateTime? Started { get; set; }
        public DateTime? Completed { get; set; }
        public DateTime? Cancelled { get; set; }
        public string Parameters { get; set; }
        
        public Workbench Workbench { get; set; }
        public WorkplaceProcess WorkplaceProcess { get; set; }
        public ICollection<OperationHostDevice> Devices { get; set; }
    }
}
