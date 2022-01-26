using System;
using System.Collections.Generic;

namespace Microprojects.Edm.Jobs
{
    [Job(Name = "Stop", Lifetime = JobLifetime.ShortRunning)]
    public class StopJob : BaseJob
    {
        private IJob Job { get; }

        public StopJob(IJob job)
        {
            Job = job;
            JobParameters = job.JobParameters;
        }

        public override Dictionary<string, object> GetParameters()
        {
            var p = Job.GetParameters();
            p.Add("Job", Job.Name);
            return p;
        }
    }
}
