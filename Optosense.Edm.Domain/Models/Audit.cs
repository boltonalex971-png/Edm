using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Audit : TypeObject
    {
        public int ProfileId { get; set; }

        /// <summary>
        /// Contains audit rules in JSON format of AuditZone[]
        /// </summary>
        public string Rules { get; set; }

        public Profile Profile { get; set; }
        public ICollection<AuditZone> Zones { get; set; }
    }
}
