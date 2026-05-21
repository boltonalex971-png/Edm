using System.Collections.Generic;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    /// <summary>
    /// Defines a working place with devices allowed to be used in processes, allowed for the workplace.
    /// </summary>
    public class Workplace : DirectoryEntry
    {
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
