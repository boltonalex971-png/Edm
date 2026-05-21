using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IOperationService : ILegacyIntGenericService<Operation>
    {
        Task<Operation> Create(Operation operation);
        Task<(Operation, Process)> Launch(string processUid, string workbenchUid);
        Task<Operation> Start(int operationId, DateTime startAt);
        Task<Operation> Stop(int operationId);
        Task<IEnumerable<Record>> GetRecords(int operationId, int lastRecordId);
        Task<(bool, string)> GetResult(int operationId);
        Task<IEnumerable<OperationCriterion>> GetCriterion(int operationId, int lastId);
        Task<IEnumerable<OperationCriterion>> GetCriteria(int operationId);
        Task<IEnumerable<OperationHostDevice>> GetOperationDevices(int id);
        Task<OperationStatus> Status(int operationId);
        Task<Operation> StopOperation(int operationId);
        Task<Operation> CompleteOperation(int operationId);
        Task<Operation> Copy(int id);
        Task<OperationStatus> GetStatus(Operation operation);
    }
}
