using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class AuditCriterion : DomainObject
    {
        public int ZoneId { get; set; }
        public string Param { get; set; }
        public string Function { get; set; }
        public string Args { get; set; }
        public string Arg1 { get; set; }
        public string Arg2 { get; set; }

        public AuditZone Zone { get; set; }
    }
}
