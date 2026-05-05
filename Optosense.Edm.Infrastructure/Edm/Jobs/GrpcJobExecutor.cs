using Grpc.Net.Client;
using Microprojects.Edm.Jobs;
using Newtonsoft.Json;
using Optosense.Edm.Core.Infrastructure;
using Optosense.Edm.Infrastructure.Protos;
using System;
using System.Net.Http;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;

namespace Optosense.Edm.Infrastructure.Edm.Jobs
{
    public class GrpcJobExecutor : IGrpcJobExecutor
    {
        private readonly X509Certificate2 _clientCertificate;

        public GrpcJobExecutor(IClientCertificateProvider certProvider)
        {
            _clientCertificate = certProvider?.Get();
        }

        public async Task<JobResponse> ExecuteAsync(IJob job, string host, object parameters = null)
        {
            if (job == null)
            {
                throw new Exception("Job cannot be null");
            }

            using var channel = CreateChannel(host);
            var client = new JobExecutor.JobExecutorClient(channel);
            return await client.ExecuteJobAsync(new JobParams
            {
                Job = job.Name,
                Params = JsonConvert.SerializeObject(parameters ?? job.GetParameters())
            });
        }

        // Build a gRPC channel that presents a client cert during the TLS
        // handshake when one is configured. Used for mutual-TLS auth on the
        // GrpcSecure endpoint (ClientCertificateMode=AllowCertificate).
        private GrpcChannel CreateChannel(string host)
        {
            if (_clientCertificate == null)
            {
                return GrpcChannel.ForAddress(host);
            }
            var handler = new HttpClientHandler();
            handler.ClientCertificates.Add(_clientCertificate);
            return GrpcChannel.ForAddress(host, new GrpcChannelOptions { HttpHandler = handler });
        }
    }

    // Local in-process job dispatch through IJobContainer. Lives alongside the
    // gRPC executor for historical reasons but has no transport-level
    // dependencies; safe to keep as a static extension.
    internal static class LocalJobExecutor
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
