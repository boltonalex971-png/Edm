using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public enum HierarchyType
    {
        Any = 0,
        Process = 1,
        Workplace = 2,
        Host = 3,
        Device = 4,
    }

    public class Hierarchy : TypeObject
    {
        public static int GeneralRootId { get; } = 0;

        public int? ParentId { get; set; }

        public HierarchyType Type { get; set; }
        public bool IsPublic { get; set; } = true;
        public string Owner { get; set; }
        public string Group { get; set; }

        public Hierarchy Parent { get; set; }
    }
}
