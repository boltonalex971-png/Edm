using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Main.Models
{
    public class HostModel : Host
    {
        public bool Active { get; set; }
        public string Version { get; set; }
        public string Mode { get; set; }
        public string Environment { get; set; }
        public int UiPort { get; set; }
    }
}
