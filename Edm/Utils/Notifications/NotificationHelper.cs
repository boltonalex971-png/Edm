using System;
using System.Collections.Generic;
using System.Composition;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Cache.Redis;

namespace Microprojects.Edm.Utils.Notifications
{
    public class NotificationHelper
    {
        private static NotificationHelper _instance;

        // TODO Why the fuck it is empty??
        [Import]
        protected ICache Cache { get; set; } = new RedisCache();

        public static NotificationHelper GetInstance()
        {
            return _instance ?? (_instance = new NotificationHelper());
        }

        public void Send(Notification notification)
        {
            Cache.Push(notification); 
        }

        public void Send(NotificationSeverity severity, string message)
        {
            Send(new Notification() { Severity = severity, Message = $"{message}" });
        }
    }
}
