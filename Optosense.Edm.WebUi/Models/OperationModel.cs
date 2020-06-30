using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Optosense.Edm.WebUi.Models
{
    public class OperationModel
    {
        public int Id { get; set; }
        public int ProcessId { get; set; }
        public string ProcessName { get; set; }
        public string ProcessDescription { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Started { get; set; }
        public DateTime? Completed { get; set; }
    }
}
