using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Contracts
{
    public interface IGenericService<T>
    {
        Task<IEnumerable<T>> GetAll();
        Task<T> Get(int id);
        Task<T> Get<T1>(int id, Expression<Func<T, T1>> include);
        Task<IEnumerable<T>> Get(Expression<Func<T, bool>> predicate);
        Task<IEnumerable<T>> Get<T1>(Expression<Func<T, bool>> predicate, Expression<Func<T, T1>> include);
        Task<T> Save(T device);
        Task<T> Delete(int id);
    }
}
