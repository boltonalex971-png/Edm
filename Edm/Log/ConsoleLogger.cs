using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace Microprojects.Edm.Log
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
