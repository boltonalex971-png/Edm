using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using System;

namespace Microprojects.Edm.Ui.Main.Models
{
    public class WorkbenchViewModel
    {
        public int Id { get; set; }
        public string CommonUid { get; set; }
        public int WorkplaceId { get; set; }
        public int WorkplaceProcessId { get; set; }
        public string Name { get; set; }
        public string WorkplaceName { get; set; }
        public int ProcessId { get; set; }
        public string ProcessName { get; set; }
        public Guid OperationGuid { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }
}
