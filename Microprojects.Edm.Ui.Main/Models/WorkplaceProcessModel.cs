using System;

namespace Optosense.Edm.Webui.Models
{
    public class WorkplaceProcessModel
    {
        public int Id { get; set; }
        public int WorkplaceId { get; set; }
        public int ProcessId { get; set; }

        public string ProcessName { get; set; }
        public string ProcessDescription { get; set; }
        public string WorkplaceName { get; set; }
        public string WorkplaceDescription { get; set; }
    }
}
