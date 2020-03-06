using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
 
    public class ProfilePoint : DomainObject
    {
        public int ProfileId { get; set; }
        public int Order { get; set; }
        public long Offset { get; set; }
        public string Operation { get; set; }

        public Profile Profile { get; set; }
    }
}
