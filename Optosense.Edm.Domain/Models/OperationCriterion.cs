using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class OperationCriterion : DomainObject
    {
        public int OperationId { get; set; }
        public int AuditCriterionId { get; set; }
        public bool Valid { get; set; }
        public string Selector { get; set; }
        public string Result { get; set; }
        public string Message { get; set; }

        public virtual Operation Operation { get; set; }
        public virtual AuditCriterion AuditCriterion { get; set; }
    }
}
