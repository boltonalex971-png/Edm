using Optosense.Edm.Domain.Models;
using System;

namespace Optosense.Edm.Webui.Models
{
    public class WorkbenchViewModel
    {
        public int Id { get; set; }
        public int WorkplaceId { get; set; }
        public int WorkplaceProcessId { get; set; }
        public string Name { get; set; }
        public string WorkplaceName { get; set; }
        public string ProcessName { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }
}
