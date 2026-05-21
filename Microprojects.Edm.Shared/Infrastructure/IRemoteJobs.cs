using System;
using System.Threading.Tasks;
using Microprojects.Edm.Jobs;

namespace Microprojects.Edm.Infrastructure
{
    public interface IRemoteJobs
    {
        Task<string> Execute(string host, IJob job);
        Task<string> StartDevice(
            Guid linkId,
            string url,
            dynamic options,
            string Profile,
            Guid driverGuid,
            DateTime startAt);
        Task<ResponseData> StartOperation(Guid operationId, DateTime startAt);
        Task<string> StartTestOperation(Guid operationId, DateTime startAt);
        Task<bool> CheckOperationRun(Guid operationId);
        Task<string> CancelOperation(Guid operationId);
    }
}
