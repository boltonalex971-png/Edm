using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Models;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IOperationService : IGenericService<Operation>
    {
        Task<Operation> Create(Operation operation);
        Task<(Operation, Process)> Launch(string processUid, string workbenchUid);
        Task<Operation> Start(Guid operationId, DateTime startAt);
        Task<Operation> Stop(Guid operationId);
        Task<IEnumerable<Record>> GetRecords(Guid operationId, Guid? lastRecordId);
        Task<(bool, string)> GetResult(Guid operationId);
        Task<IEnumerable<OperationCriterion>> GetCriterion(Guid operationId, Guid? lastId);
        Task<IEnumerable<OperationCriterion>> GetCriteria(Guid operationId);
        Task<IEnumerable<OperationHostDevice>> GetOperationDevices(Guid id);
        Task<OperationStatus> Status(Guid operationId);
        Task<Operation> StopOperation(Guid operationId);
        Task<Operation> CompleteOperation(Guid operationId);
        Task<Operation> Copy(Guid id);
        Task<OperationStatus> GetStatus(Operation operation);
    }
}
