using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class AuditCriterion : DomainObject
    {
        public Guid ZoneId { get; set; }
        public string Param { get; set; }
        public string Function { get; set; }
        public string Args { get; set; }
        public string Arg1 { get; set; }
        public string Arg2 { get; set; }

        public AuditZone Zone { get; set; }
    }
}
