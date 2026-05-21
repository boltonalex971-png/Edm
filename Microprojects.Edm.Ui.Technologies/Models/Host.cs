using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Host : DirectoryEntry
    {
        public string Url { get; set; }
        public int Port { get; set; }
        public ICollection<HostDevice> Devices { get; set; }

        // Runtime liveness, set by HostService.GetAll from the active-peer hive.
        [NotMapped]
        public bool Active { get; set; }
    }
}
