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
        Task<IEnumerable<Operation>> Get<T>(
            Expression<Func<Operation, bool>> predicate,
            Expression<Func<Operation, T>> include);
        Task<Operation> Start(int operationId, DateTime startAt);
        Task<Operation> Stop(int operationId);
        Task<string> GetTasks();
        Task<IEnumerable<Record>> GetRecords(int operationId, int lastRecordId);
    }
}
