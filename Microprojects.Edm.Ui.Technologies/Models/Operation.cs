using System;
using System.Collections.Generic;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Operation : DomainObject, IWithMeta
    {
        public string Name { get; set; }
        public string Description { get; set; }

        public Guid? WorkbenchId { get; set; }
        public Guid? WorkplaceProcessId { get; set; }
        public DateTime Created { get; set; } = DateTime.UtcNow;
        public DateTime? Scheduled { get; set; }
        public DateTime? Started { get; set; }
        public DateTime? Completed { get; set; }
        public DateTime? Cancelled { get; set; }
        public string Parameters { get; set; }

        public Workbench Workbench { get; set; }
        public WorkplaceProcess WorkplaceProcess { get; set; }
        public ICollection<OperationHostDevice> Devices { get; set; }

        public Meta Meta { get; set; } = null!;
    }
}
