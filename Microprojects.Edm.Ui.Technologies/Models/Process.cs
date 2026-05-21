using System;
using System.Collections.Generic;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Process : DirectoryEntry
    {
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
