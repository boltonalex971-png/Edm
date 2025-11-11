using Grpc.Net.Client;
using Microprojects.Edm.Jobs;
using Newtonsoft.Json;
using Optosense.Edm.Infrastructure.Protos;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Infrastructure.Edm.Jobs
{
    internal static class GrpcJobExecutor
    {
        public static async Task<JobResponse> Execute(this IJob job, string host, object parameters = null)
        {
            if (job == null)
            {
                throw new Exception("Job cannot be null");
            }

            using var channel = GrpcChannel.ForAddress(host);
            var client = new JobExecutor.JobExecutorClient(channel);
            var response = await client.ExecuteJobAsync(new JobParams
            {
                Job = job.Name,
                Params = JsonConvert.SerializeObject(parameters ?? job.GetParameters())
            });
            return response;
        }

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
