using System;
using System.Collections.Generic;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Audit : DomainObject, IWithMeta
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid ProfileId { get; set; }

        /// <summary>
        /// Contains audit rules in JSON format of AuditZone[]
        /// </summary>
        public string Rules { get; set; }

        public Profile Profile { get; set; }
        public ICollection<Qualifier> Qualifiers { get; set; }
        public ICollection<AuditZone> Zones { get; set; }

        public Meta Meta { get; set; } = null!;
    }
}
