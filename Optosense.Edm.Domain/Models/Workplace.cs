using System;
using System.Collections.Generic;

namespace Optosense.Edm.Domain.Models
{
    /// <summary>
    /// Defines a working place with devices allowed to be used in processes, allowed for the workplace.
    /// </summary>
    public class Workplace : TypeObject
    {
        // TODO Think about tree-like grouping (divisions, sub-divisions etc) and 
        //      attached list of authorized personnel for each workplace.

        /// <summary>
        /// List of attached devices
        /// </summary>
        public ICollection<HostDevice> Devices { get; set; }
    }
}
