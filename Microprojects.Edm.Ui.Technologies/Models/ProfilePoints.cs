using System;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class ProfilePoint : DomainObject
    {
        public Guid ProfileId { get; set; }
        public int Order { get; set; }
        public long Offset { get; set; }
        public string Operation { get; set; }

        public Profile Profile { get; set; }
    }
}
