using Microprojects.Edm.Domain;
using System;
using System.ComponentModel.DataAnnotations;
//using OptoSense.Domain.Properties;
//using OptoSense.Utils.Attrbute;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class HierarchyObject : TypeObject
    {
        public virtual HierarchyType HierarchyType { get; }
        public int HierarchyId { get; set; }
        public Hierarchy Hierarchy { get; set; }
    }
}
