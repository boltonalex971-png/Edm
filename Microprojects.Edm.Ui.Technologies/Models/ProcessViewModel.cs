using System;
using System.Collections.Generic;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class ProcessViewModel
    {
        public Guid Id { get; set; }
        public string CommonUid { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid? DirectoryId { get; set; }
        public Guid OperationGuid { get; set; }
        public string Message { get; set; }
        public IEnumerable<QualifierViewModel> Qualifiers { get; set; }
        public IEnumerable<ProfileViewModel> Profiles { get; set; }
    }

    public class QualifierViewModel
    {
        public Guid Id { get; set; }
        public string Name { set; get; }
        public string Description { set; get; }
    }
}
