using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class AuditZone : DomainObject
    {
        public int AuditId { get; set; }
        public int? No { get; set; }
        public int Offset { get; set; }
        public int Duration { get; set; }
        public Audit Audit { get; set; }
        public ICollection<AuditCriterion> Criteria { get; set; }
    }
}
