using Optosense.Edm.Domain.Models;
using System;
using System.Collections;
using System.Collections.Generic;

namespace Microprojects.Edm.Ui.Main.Models
{
    public class ProcessViewModel 
    {
        public int Id { get; set; }
        public string CommonUid { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
        public HierarchyType HierarchyType { get; set; }
        public int HierarchyId { get; set; }
        public Guid OperationGuid { get; set; }
        public string Message { get; set; }
        public IEnumerable<QualifierViewModel> Qualifiers { get; set; }
    }

    public class QualifierViewModel
    {
        public int Id { get; set; }
        public string Name { set; get; }
        public string Description { set; get; }
        public bool IsActive { get; set; }
    }
}
