using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class RecordOperationCriterion : DomainObject
    {
        public Guid RecordId { get; set; }
        public Guid OperationCriterionId { get; set; }

        public Record Record { get; set; }
        public OperationCriterion OperationCriterion { get; set; }
    }
}
