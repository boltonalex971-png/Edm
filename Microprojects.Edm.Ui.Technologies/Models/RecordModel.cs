using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class RecordModel
    {
        public int Id { get; set; }
        public bool Valid { get; set; }
        public string Selector { get; set; }
        public string Result { get; set; }
        public string Message { get; set; }
        public string AuditCriterionParam { get; set; }
        public string AuditCriterionFunction { get; set; }
        public string AuditCriterionArgs { get; set; }
        public string AuditCriterionArg1 { get; set; }
        public string AuditCriterionArg2 { get; set; }
        public int? ZoneAuditCriterionNo { get; set; }
        public int ZoneAuditCriterionOffset { get; set; }
        public int ZoneAuditCriterionDuration { get; set; }
    }
}
