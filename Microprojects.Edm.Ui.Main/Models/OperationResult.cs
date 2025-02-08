using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Main.Models
{
    public class OperationResult
    {
        public bool IsValid { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Message { get; set; }
        public string Error { get; set; }
    }
}
