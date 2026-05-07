using Microprojects.Edm.Jobs;
using Newtonsoft.Json;
using System;
using System.Threading.Tasks;

namespace Microprojects.Edm.Grpc
{
    // Local in-process job dispatch through IJobContainer. Lives alongside the
    // gRPC executor for historical reasons but has no transport-level
    // dependencies; safe to keep as a static extension.
    public static class LocalJobExecutor
    {
        public static async Task<JobResponse> Execute(this IJobContainer container, IJob job, object parameters = null)
        {
            if (job == null)
            {
                throw new Exception("Job cannot be null");
            }
            var jobResponse = new JobResponse();
            try
            {
                var response = await container.ExecuteAsync(new JobData
                {
                    Job = job.Name,
                    Params = JsonConvert.SerializeObject(parameters ?? job.GetParameters())
                });
                jobResponse.Message = response.Message;
                jobResponse.Status = response.Status;
                jobResponse.Response = response.Response;
            }
            catch (Exception e)
            {
                jobResponse.Message = e.Message;
                jobResponse.Status = JobStatus.FAILED;
            }

            return jobResponse;
        }
    }
}
