using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Process : DomainObject
    {
        public DateTime Created { get; set; } = DateTime.Now;
        public DateTime? Started { get; set; }
        public DateTime? Completed { get; set; }
        
        public ICollection<ProcessHostDevice> Devices { get; set; }
    }
}
