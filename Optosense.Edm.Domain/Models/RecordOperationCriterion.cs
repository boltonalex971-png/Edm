using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class RecordOperationCriterion : DomainObject
    {
        public int RecordId { get; set; }
        public int OperationCriterionId { get; set; }

        public Record Record { get; set; }
        public OperationCriterion OperationCriterion { get; set; }
    }
}
