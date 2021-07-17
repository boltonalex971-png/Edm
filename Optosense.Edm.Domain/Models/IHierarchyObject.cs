using System;
using System.ComponentModel.DataAnnotations;
//using OptoSense.Domain.Properties;
//using OptoSense.Utils.Attrbute;

namespace Optosense.Edm.Domain.Models
{
    public interface IHierarchyObject 
    {
        HierarchyType HierarchyType { get; }
        int HierarchyId { get; set; }
        Hierarchy Hierarchy { get; set; }
    }
}
