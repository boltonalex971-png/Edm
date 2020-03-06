using Microprojects.Edm;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Threading.Tasks;

namespace Edm.Test
{
    [TestClass]
    public class PluginTest
    {
        [TestMethod]
        public async Task LoadPluginTest()
        {
            EdmConfig.Configure(c => c.SetPluginPaths(
                @"C:\Projects\2020\Edm\Edm.Test\bin\Debug\netcoreapp3.0\Edm.Test.dll",
                @"C:\Projects\2020\Edm\Edm.Test\bin\Debug\netcoreapp3.0\Microprojects.Edm.dll"
            ));
            var tasks = CommandManager.GetInstance().GetAvailableTasks();
            var result = await CommandManager.GetInstance().Execute(new CommandData { Command = "Test", Params = "{Profile: \"[{Millis: 100, Value: 0.5}]\"}" });
        }
    }
}
