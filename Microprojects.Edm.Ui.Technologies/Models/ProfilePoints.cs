using Microprojects.Edm.Domain;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
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
