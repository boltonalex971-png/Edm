using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Device : DirectoryEntry
    {
        public string Parameters { get; set; }
        public Guid DriverGuid { get; set; }

        [NotMapped]
        public string DriverName { get; set; }
        [NotMapped]
        public Guid ProfilerGuid { get; set; }
        [NotMapped]
        public string ProfilerName { get; set; }

        public ICollection<HostDevice> Hosts { get; set; }
    }
}
