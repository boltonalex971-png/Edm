using System.Threading.Tasks;
using Microprojects.Edm.Jobs;

namespace Optosense.Edm.Test.Jobs;

[Job(Lifetime = JobLifetime.LongRunning, Parameters = typeof(TestJobParameters))]
public class TestJob : BaseJob
{
    protected TestJobParameters Parameters => (TestJobParameters)JobParameters;
    
    public override async Task<object> ExecuteAsync()
    {
        await Task.Delay(Parameters.Delay);
        return Task.FromResult<object>("Ok");
    }
}

public class TestJobParameters : JobParameters
{
    public int Delay { get; set; } = 10_000;
} 
