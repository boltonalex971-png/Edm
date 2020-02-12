using Microprojects.Edm;
using Microprojects.Edm.Commands;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Edm.Test.Plugins
{
    [Command(Name = "Test", Lifetime = CommandType.ShortRunning, Parameters = typeof(TestCommandParameters))]
    class TestCommand : BaseCommand
    {
        public async override Task<object> ExecuteAsync()
        {
            return await Task.FromResult(this.CommandParameters);
        }
    }

    public class TestCommandParameters : ICommandParameters
    {
        public string CacheConnectionString { get; set; }
        public string Port { get; set; }
        public string Command { get; set; }
        [CommandParameter(Name = "Address")]
        public int? SensorAddress { get; set; }
        public bool SingleLine { get; set; } = false;
        public int BaudRate { get; set; } = 57600;
        public int DataBits { get; set; } = 8;
        public int Timeout { get; set; } = 1200;
        public IEnumerable<ProfilePoint> Profile { get; set; }
    }

    public class ProfilePoint
    {
        public long Millis { get; set; }
        public double Value { get; set; }
    }
}
