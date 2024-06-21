using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Process : HierarchyObject
    {
        public override HierarchyType HierarchyType => HierarchyType.Process;
        public Guid OperationGuid { get; set; }
        public string CommonUid { get; set; }

        /// <summary>
        /// Set of recommended device profiles that can be applied on
        /// configuring operation
        /// </summary>
        public ICollection<Profile> Profiles { get; set; }
        public ICollection<Qualifier> Qualifiers { get; set; }
    }
}
