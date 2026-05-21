using System;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class WorkplaceProcessModel
    {
        public int Id { get; set; }
        public Guid WorkplaceId { get; set; }
        public Guid ProcessId { get; set; }

        public string ProcessName { get; set; }
        public string ProcessDescription { get; set; }
        public string WorkplaceName { get; set; }
        public string WorkplaceDescription { get; set; }

        public ProcessViewModel Process { get; set; }
    }
}
