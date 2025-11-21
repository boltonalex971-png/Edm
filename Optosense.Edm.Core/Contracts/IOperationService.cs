using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Contracts
{
    public interface IOperationService : IGenericService<Operation> 
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
        Task <OperationStatus> GetStatus(Operation operation);
    }
}
