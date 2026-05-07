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
    public class RecordOperationCriterion : DomainObject
    {
        public int RecordId { get; set; }
        public int OperationCriterionId { get; set; }

        public Record Record { get; set; }
        public OperationCriterion OperationCriterion { get; set; }
    }
}
