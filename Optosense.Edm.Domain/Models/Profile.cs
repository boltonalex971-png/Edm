using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
 
    public class Profile : NamedObject
    {
        public ICollection<ProfilePoint> Points { get; set; }
    }
}
