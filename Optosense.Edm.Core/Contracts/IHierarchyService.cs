using System.Collections.Generic;
using System.Threading.Tasks;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;

namespace Optosense.Edm.Core.Contracts
{
    public interface IHierarchyService : IGenericService<Hierarchy>
    {
        Task<Hierarchy> ChangeParent(int id, int newParentId);
        Task<Hierarchy> GetRoot(HierarchyType type);
        Task<IEnumerable<Hierarchy>> GetTree(HierarchyType type, IEnumerable<string> groups);
    }
}