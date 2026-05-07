using Microprojects.Edm.Ui.Technologies.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Optosense.Edm.Core.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Main.Models
{
    public class OperationViewModel
    {
        public int Id { get; set; }
        public int WorkbenchId { get; set; }
        public string WorkbenchName { get; set; }
        public string WorkplaceName { get; set; }
        public int ProcessId { get; set; }
        public string ProcessName { get; set; }
        public string ProcessDescription { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Started { get; set; }
        public DateTime? Completed { get; set; }
        public DateTime? Cancelled { get; set; }
        public string Parameters { get; set; }
        public OperationState State { get; set; }
    }
}
