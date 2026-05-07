using System.Threading.Tasks;
using Microprojects.Edm.Jobs;
using Microprojects.Edm.Grpc;

namespace Microprojects.Edm.Grpc
{
    // Dispatches jobs to peer EDM hosts over gRPC. Implementations own the
    // transport-level concerns (channel construction, mutual-TLS client cert,
    // serialization), so callers stay at the job-domain layer.
    public interface IGrpcJobExecutor
    {
        Task<JobResponse> ExecuteAsync(IJob job, string host, object parameters = null);
    }
}
