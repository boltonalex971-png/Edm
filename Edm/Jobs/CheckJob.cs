using System;
using System.Collections.Generic;

namespace Microprojects.Edm.Jobs
{
    public class CheckJob : BaseJob
    {
        private IJob Job { get; }

        public CheckJob(IJob job)
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
