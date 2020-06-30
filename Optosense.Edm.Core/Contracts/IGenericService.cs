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
        Task<IEnumerable<T>> Get(Expression<Func<T, bool>> predicate);
        Task<T> Save(T device);
        Task<T> Delete(int id);
    }
}
