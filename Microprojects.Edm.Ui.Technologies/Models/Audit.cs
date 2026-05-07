using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Audit : TypeObject
    {
        public int ProfileId { get; set; }

        /// <summary>
        /// Contains audit rules in JSON format of AuditZone[]
        /// </summary>
        public string Rules { get; set; }

        public Profile Profile { get; set; }
        public ICollection<Qualifier> Qualifiers { get; set; }
        public ICollection<AuditZone> Zones { get; set; }
    }
}
