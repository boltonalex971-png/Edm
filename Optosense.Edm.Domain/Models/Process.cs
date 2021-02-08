using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Process : TypeObject
    {
        /// <summary>
        /// Set of recommended device profiles that can be applied on
        /// configuring operation
        /// </summary>
        public ICollection<Profile> Profiles { get; set; }
    }
}
