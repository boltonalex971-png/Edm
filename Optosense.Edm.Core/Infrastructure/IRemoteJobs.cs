using Microprojects.Edm.Jobs;
using System;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Infrastructure
{
    public interface IRemoteJobs 
    {
        Task<string> Execute(string host, IJob job);
        Task<string> StartDevice(
            int linkId,
            string url,
            dynamic options,
            string Profile,
            Guid driverGuid,
            DateTime startAt);
        Task<string> StartOperation(int operationId, DateTime startAt);
        Task<string> StartTestOperation(int operationId, DateTime startAt);
        Task<bool> CheckOperationRun(int operationId);
        Task<string> CancelOperation(int operationId);
    }
}