using System;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class WorkbenchViewModel
    {
        public int Id { get; set; }
        public string CommonUid { get; set; }
        public Guid WorkplaceId { get; set; }
        public int WorkplaceProcessId { get; set; }
        public string Name { get; set; }
        public string WorkplaceName { get; set; }
        public Guid ProcessId { get; set; }
        public string ProcessName { get; set; }
        public Guid OperationGuid { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }
}
