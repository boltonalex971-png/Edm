using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Utils.Notifications
{
    public enum NotificationSeverity
    {
        Notification,
        Warning,
        Error,
        Catastrophe
    }

    public class Notification
    {
        public NotificationSeverity Severity { get; set; }

        public string Message { get; set; }

    }
}
