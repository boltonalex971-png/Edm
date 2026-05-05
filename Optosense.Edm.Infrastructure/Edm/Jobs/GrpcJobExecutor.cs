using Grpc.Net.Client;
using Microprojects.Edm.Jobs;
using Newtonsoft.Json;
using Optosense.Edm.Infrastructure.Protos;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Infrastructure.Edm.Jobs
{
    internal static class GrpcJobExecutor
    {
        public static async Task<JobResponse> Execute(this IJob job, string host, object parameters = null, X509Certificate2 clientCertificate = null)
        {
            if (job == null)
            {
                throw new Exception("Job cannot be null");
            }

            using var channel = CreateChannel(host, clientCertificate);
            var client = new JobExecutor.JobExecutorClient(channel);
            var response = await client.ExecuteJobAsync(new JobParams
            {
                Job = job.Name,
                Params = JsonConvert.SerializeObject(parameters ?? job.GetParameters())
            });
            return response;
        }

        // Build a gRPC channel that presents a client cert during the TLS
        // handshake. Used for mutual-TLS auth on the GrpcSecure endpoint
        // (ClientCertificateMode=AllowCertificate). When clientCertificate is
        // null, falls back to an anonymous channel.
        private static GrpcChannel CreateChannel(string host, X509Certificate2 clientCertificate)
        {
            if (clientCertificate == null)
            {
                return GrpcChannel.ForAddress(host);
            }
            var handler = new HttpClientHandler();
            handler.ClientCertificates.Add(clientCertificate);
            return GrpcChannel.ForAddress(host, new GrpcChannelOptions { HttpHandler = handler });
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
