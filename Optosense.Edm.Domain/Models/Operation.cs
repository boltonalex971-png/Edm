using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Operation : TypeObject
    {
        public int ProcessId { get; set; }

        public DateTime Created { get; set; } = DateTime.Now;
        public DateTime? Scheduled { get; set; }
        public DateTime? Started { get; set; }
        public DateTime? Completed { get; set; }
        public DateTime? Cancelled { get; set; }
        
        public Process Process { get; set; }
        public ICollection<OperationHostDevice> Devices { get; set; }
    }
}
