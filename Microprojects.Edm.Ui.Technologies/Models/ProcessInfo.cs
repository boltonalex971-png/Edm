using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class ProcessInfo
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid AppGuid { get; set; }
        public string AppHomepage { get; set; }
        public IEnumerable<string> Parameters { get; set; }
        public string Settings { get; set; }
    }
}
