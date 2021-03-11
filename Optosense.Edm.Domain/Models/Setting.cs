using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Setting : DomainObject
    {
        public Guid Guid { get; set; }
        public string Name { get; set; }
        public string Value { get; set; }
    }
}
