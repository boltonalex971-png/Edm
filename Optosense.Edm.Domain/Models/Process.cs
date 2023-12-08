using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public class Process : TypeObject, IHierarchyObject
    {
        public HierarchyType HierarchyType => HierarchyType.Process;
        public int HierarchyId { get; set; }
        public Guid OperationGuid { get; set; }
        public string CommonUid { get; set; }

        public Hierarchy Hierarchy { get; set; }
        /// <summary>
        /// Set of recommended device profiles that can be applied on
        /// configuring operation
        /// </summary>
        public ICollection<Profile> Profiles { get; set; }
        public ICollection<Qualifier> Qualifiers { get; set; }
    }
}
