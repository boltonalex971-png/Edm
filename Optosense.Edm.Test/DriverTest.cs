using Microprojects.Edm;
using Microprojects.Edm.Log;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Optosense.Edm.Domain.Models;
using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace Optosense.Edm.Test
{
    [TestClass]
    public class DriverTest
    {
        [TestMethod]
        public async Task StartDeviceTestAsync()
        {
            Logger.SetLogger(new DebugLogger());
            EdmConfig.Configure(c => c.SetPluginPaths(
                //@"C:\Projects\2020\Edm\Edm.Test\bin\Debug\netcoreapp3.0\Edm.Test.dll",
                @"C:\Projects\2020\Edm\Edm.Test\bin\Debug\netcoreapp3.0\Microprojects.Edm.dll",
                @"C:\Projects\2020\Edm\Optosense.Edm.Test\bin\Debug\netcoreapp3.1\Optosense.Edm.dll"
            ));
            var tasks = CommandManager.GetInstance().GetAvailableTasks();
            var result = await CommandManager.GetInstance().Execute(new CommandData { 
                Command = "StartDevice",
                Params = $@"{{
                            Device: ""{DeviceModel.NullGas}"",
                            DriverOptions: {{}},
                            Profile: [
                                {{Order:  0, Offset: 1000, Operation: ""Start""}},
                                {{Order: 10, Offset: 2000, Operation: ""Set 10""}},
                                {{Order: 20, Offset: 2000, Operation: ""Ping""}},
                                {{Order: 30, Offset: 3000, Operation: ""Set 50""}},
                                {{Order: 40, Offset: 2000, Operation: ""Ping""}},
                                {{Order: 50, Offset: 3000, Operation: ""Stop""}}
                            ]}}"
                //Params = $@"{{
                //            Device: ""{DeviceModel.Board}"",
                //            DriverOptions: {{Port: ""COM4"", Baudrate: 9600}},
                //            Profile: [
                //                {{Order: 10, Offset: 1000, Operation: ""#00F""}},
                //                {{Order: 20, Offset: 1000, Operation: ""#00F""}},
                //                {{Order: 30, Offset: 1000, Operation: ""#00F""}},
                //                {{Order: 40, Offset: 1000, Operation: ""#00F""}},
                //                {{Order: 50, Offset: 1000, Operation: ""#00F""}}
                //            ]}}"
            });
            Thread.Sleep(30000);
        }
    }

    public class DebugLogger : ILogger
    {
        public void Log(string message, LogType type)
        {
            Debug.WriteLine($"{DateTime.Now} {type}: {message}");
        }

        public void Error(string message)
        {
            Log(message, LogType.Error);
        }
    }
}
