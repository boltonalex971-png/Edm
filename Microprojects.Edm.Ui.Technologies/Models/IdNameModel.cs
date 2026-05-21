using System;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class IdNameModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }

    // Sibling for entities still tracked by int PKs (HostDevice and other
    // legacy junction tables). When those flip to Guid in a later phase
    // this class can be deleted.
    public class IntIdNameModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
