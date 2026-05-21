using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class OperationCriterion : DomainObject
    {
        public Guid OperationId { get; set; }
        public Guid AuditCriterionId { get; set; }
        public bool Valid { get; set; }
        public string Selector { get; set; }
        public string Result { get; set; }
        public string Message { get; set; }

        public virtual Operation Operation { get; set; }
        public virtual AuditCriterion AuditCriterion { get; set; }
    }
}
