using System;
using Microprojects.Edm.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class OperationViewModel
    {
        public Guid Id { get; set; }
        public string Number { get; set; }
        public Guid WorkbenchId { get; set; }
        public string WorkbenchName { get; set; }
        public string WorkplaceName { get; set; }
        public Guid ProcessId { get; set; }
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
