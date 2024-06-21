using System;
using System.ComponentModel.DataAnnotations;
//using OptoSense.Domain.Properties;
//using OptoSense.Utils.Attrbute;

namespace Optosense.Edm.Domain.Models
{
    public class HierarchyObject : TypeObject
    {
        public virtual HierarchyType HierarchyType { get; }
        public int HierarchyId { get; set; }
        public Hierarchy Hierarchy { get; set; }
    }
}
