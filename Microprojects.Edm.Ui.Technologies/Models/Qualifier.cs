using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Qualifier : TypeObject
    {
        public Guid ProcessId { get; set; }

        public Process Process { get; set; }
    }
}
