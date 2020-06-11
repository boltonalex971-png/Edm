using System;
using System.Collections.Generic;

namespace Optosense.Edm.Domain.Models
{
    /// <summary>
    /// Defines a working place with devices allowed to be used in processes, allowed for the workplace.
    /// </summary>
    public class WorkplaceProcess : DomainObject
    {
        public int WorkplaceId { get; set; }
        public Workplace Workplace { get; set; }
        public int ProcessId { get; set; }
        /// <summary>
        /// List of processes, allowed to run on this workplace
        /// </summary>
        public Process Process { get; set; }
    }
}
