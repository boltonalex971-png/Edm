using Microprojects.Edm.Log;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace Optosense.Edm.WebApi.Utils
{
    public class ConsoleLogger : ILogger
    {
        public void Log(string message, LogType type)
        {
            Console.WriteLine($"{DateTime.Now} {type}: {message}");
        }

        public void Error(string message)
        {
            Log(message, LogType.Error);
        }
    }
}
