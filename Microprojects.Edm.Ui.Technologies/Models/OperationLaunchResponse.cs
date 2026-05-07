using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Main.Models
{
    public class OperationLaunchResponse
    {
        public int Id { get; set; }
        public string UiUrl { get; set; }
        public string StatusUrl { get; set; }
        public string ValidityUrl { get; set; }
        public string Error { get; set; }
    }
}
