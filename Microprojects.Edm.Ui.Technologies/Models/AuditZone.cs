using System;
using System.Collections.Generic;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class AuditZone : DomainObject
    {
        public Guid AuditId { get; set; }
        public int? No { get; set; }
        public int Offset { get; set; }
        public int Duration { get; set; }
        public string ActiveWhen { get; set; }
        public Audit Audit { get; set; }
        public ICollection<AuditCriterion> Criteria { get; set; }
    }
}
