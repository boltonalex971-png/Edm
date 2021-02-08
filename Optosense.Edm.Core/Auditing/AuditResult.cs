using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Auditing
{
    public class AuditResult
    {
        public bool Valid { get; set; }
        public string Result { get; set; }
        public string SecondaryResult { get; set; }
        public string Message { get; set; }
    }
}
