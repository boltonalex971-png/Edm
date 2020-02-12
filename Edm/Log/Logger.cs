using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
//using Domain.Model;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Util.Notifications;

namespace Microprojects.Edm.Log
{
    public static class Logger
    {
        private static ILogger _instance;

        public static void SetLogger(ILogger logger)
        {
            _instance = logger;
        }

        public static void Log(string message)
        {
            if (_instance == null)
            {
                throw new Exception("Logger implementation must be set first");
            }
            _instance.Log(message, LogType.Info);
        }

        public static void Error(string message)
        {
            if (_instance == null)
            {
                throw new Exception("Logger implementation must be set first");
            }

            _instance.Error(message);

            try
            {
                NotificationHelper.GetInstance().Send(NotificationSeverity.Error, $"{message}");
            }
            catch (AggregateException e)
            {
                _instance.Error($"Cannot send notification message: {e.Flatten().Message}");
            }
            catch (Exception e)
            {
                _instance.Error($"Cannot send notification message: {e.Message}");
            }
        }
    }
}
