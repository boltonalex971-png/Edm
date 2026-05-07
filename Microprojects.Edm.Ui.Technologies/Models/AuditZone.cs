using Microprojects.Edm.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class AuditZone : DomainObject
    {
        public int AuditId { get; set; }
        public int? No { get; set; }
        public int Offset { get; set; }
        public int Duration { get; set; }
        public string ActiveWhen { get; set; }
        public Audit Audit { get; set; }
        public ICollection<AuditCriterion> Criteria { get; set; }
    }
}
