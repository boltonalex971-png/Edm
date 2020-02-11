using Microprojects.Edm;
using Microprojects.Edm.Commands;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Edm.Test.Plugins
{
    [Command(Name = "Test", Lifetime = CommandType.ShortRunning)]
    class TestCommand : BaseCommand
    {
        #region Command parameters

        [CommandParameter]
        public string CacheConnectionString { get; set; }

        [CommandParameter]
        public string Port { get; set; }

        [CommandParameter]
        public string Command { get; set; }

        [CommandParameter(Name = "Address")]
        public int? SensorAddress { get; set; }

        [CommandParameter]
        public bool SingleLine { get; set; } = false;

        [CommandParameter]
        public int BaudRate { get; set; } = 57600;

        [CommandParameter]
        public int DataBits { get; set; } = 8;

        [CommandParameter]
        public int Timeout { get; set; } = 1200;

        #endregion

        public async override Task<object> ExecuteAsync()
        {
            return await Task.FromResult(this);
        }
    }
}
