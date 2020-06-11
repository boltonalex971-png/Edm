using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Process : TypeObject
    {
        /// <summary>
        /// Json-formatted list of allowed device types, e.g. <code>['Gas', 'Temperature']"</code>.
        /// </summary>
        public string DeviceTypes { get; set; }
    }
}
