using System;
using System.Collections.Generic;

namespace Optosense.Edm.Domain.Models
{
    /// <summary>
    /// Defines a working place with devices allowed to be used in processes, allowed for the workplace.
    /// </summary>
    public class Workplace : TypeObject, IHierarchyObject
    {
        public HierarchyType HierarchyType => HierarchyType.Workplace;
        public int HierarchyId { get; set; }

        public Hierarchy Hierarchy { get; set; }
        /// <summary>
        /// List of attached devices
        /// </summary>
        public ICollection<WorkplaceHostDevice> Devices { get; set; }

        /// <summary>
        /// List of processes, allowed to run on this workplace
        /// </summary>
        public ICollection<WorkplaceProcess> Processes { get; set; }
    }
}
