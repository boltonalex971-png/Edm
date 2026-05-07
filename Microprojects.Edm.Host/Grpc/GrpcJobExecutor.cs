using Grpc.Net.Client;
using Microprojects.Edm.Jobs;
using Newtonsoft.Json;
using Microprojects.Edm.Infrastructure;
using Microprojects.Edm.Grpc;
using System;
using System.Net.Http;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;

namespace Microprojects.Edm.Host.Grpc
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
}
