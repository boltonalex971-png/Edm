using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Setting : DomainObject
    {
        public Guid Guid { get; set; }
        public string Name { get; set; }
        public string Value { get; set; }
    }
}
