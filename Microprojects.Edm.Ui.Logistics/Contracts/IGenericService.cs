using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface IGenericService<T>
{
    Task<IEnumerable<T>> GetAll();
    Task<T> Get(Guid id);
    Task<T> Get<T1>(Guid id, Expression<Func<T, T1>> include);
    Task<T> Get<T1, T2>(Guid id, Expression<Func<T, T1>> include, Expression<Func<T, T2>> include2);
    Task<IEnumerable<T>> Get(Expression<Func<T, bool>> predicate);
    Task<IEnumerable<T>> Get<T1>(Expression<Func<T, bool>> predicate, Expression<Func<T, T1>> include);
    Task<T> Save(T entry);
    Task<T> Delete(Guid id);
    Task<T> ChangeParent<T>(Guid entryId, Guid newParentId) where T : DirectoryEntry;
}