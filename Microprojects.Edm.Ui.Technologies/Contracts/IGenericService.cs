using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    // Legacy int-keyed generic service contract for entities still tracked by
    // int PKs (Profile, Qualifier, Audit, AuditZone, AuditCriterion, Operation,
    // OperationCriterion, OperationHostDevice, Record, RecordOperationCriterion,
    // Workbench, WorkbenchWorkplaceHostDevice, WorkplaceHostDevice, WorkplaceProcess,
    // HostDevice, Setting, ProfilePoint). Guid-id services (Host/Device/Process/
    // Workplace) inherit Microprojects.Edm.Shared.Contracts.IGenericService instead.
    public interface ILegacyIntGenericService<T> where T : LegacyIntDomainObject
    {
        Task<IEnumerable<T>> GetAll();
        Task<T> Get(int id);
        Task<T> Get<T1>(int id, Expression<Func<T, T1>> include);
        Task<T> Get<T1, T2>(int id, Expression<Func<T, T1>> include, Expression<Func<T, T2>> include2);
        Task<IEnumerable<T>> Get(Expression<Func<T, bool>> predicate);
        Task<IEnumerable<T>> Get<T1>(Expression<Func<T, bool>> predicate, Expression<Func<T, T1>> include);
        Task<IEnumerable<T>> Get<T1, T2>(Expression<Func<T, bool>> predicate, Expression<Func<T, T1>> include, Expression<Func<T, T2>> include2);
        Task<T> Save(T device);
        Task<T> Delete(int id);
    }
}
