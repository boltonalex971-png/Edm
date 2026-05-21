using System;
using System.Collections.Generic;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    /// <summary>
    /// Defines a working place with devices allowed to be used in processes, allowed for the workplace.
    /// </summary>
    public class WorkplaceProcess : DomainObject
    {
        public Guid WorkplaceId { get; set; }
        public Workplace Workplace { get; set; }
        public Guid ProcessId { get; set; }
        /// <summary>
        /// List of processes, allowed to run on this workplace
        /// </summary>
        public Process Process { get; set; }
        public ICollection<Workbench> Workbenches { get; set; } = new HashSet<Workbench>();
    }
}
