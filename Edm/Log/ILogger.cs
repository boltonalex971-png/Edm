using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Log
{

    public enum LogType
    {
        Error = 1,
        Warning = 2,
        Info = 3,
        Debug = 4,
        Trace = 5
    }

    public interface ILogger
    {
        void Log(string message, LogType type);
        void Error(string message);

    }
}
