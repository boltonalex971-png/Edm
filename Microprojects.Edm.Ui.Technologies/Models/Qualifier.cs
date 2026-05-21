using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Qualifier : DomainObject, IWithMeta
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid ProcessId { get; set; }

        public Process Process { get; set; }

        public Meta Meta { get; set; } = null!;
    }
}
