using Microprojects.Edm;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Infrastructure
{
    public interface IRemoteCommands 
    {
        Task<string> Execute(string host, ICommand command);
        Task<string> StartDevice(
            int linkId,
            string url,
            dynamic options,
            IEnumerable<ProfilePoint> Profile,
            DeviceModel model,
            DateTime startAt);
        Task<string> StartOperation(int operationId, DateTime startAt);
        Task<string> StartTestOperation(int operationId, DateTime startAt);
        Task<string> CancelOperation(int operationId);
    }
}