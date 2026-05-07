using Microprojects.Edm.Domain;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Host : HierarchyObject
    {
        public override HierarchyType HierarchyType => HierarchyType.Host;

        public string Url { get; set; }
        public int Port { get; set; }
        public ICollection<HostDevice> Devices { get; set; }
    }
}
