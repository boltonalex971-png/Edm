using Microprojects.Edm;
using Microprojects.Edm.Jobs;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Edm.Test.Plugins
{
    [Job(Name = "Test", Lifetime = JobLifetime.ShortRunning, Parameters = typeof(TestCommandParameters))]
    class TestCommand : BaseJob
    {
        protected TestCommandParameters TestCommandParameters => (TestCommandParameters) JobParameters;

        public async override Task<object> ExecuteAsync()
        {
            return await Task.FromResult(this.JobParameters);
        }
    }

    public class TestCommandParameters : IJobParameters
    {
        public string CacheConnectionString { get; set; }
        public string Port { get; set; }
        public string Command { get; set; }
        [JobParameter(Name = "Address")]
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
