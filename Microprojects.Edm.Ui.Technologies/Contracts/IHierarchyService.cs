using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IHierarchyService : IGenericService<Hierarchy>
    {
        Task<Hierarchy> ChangeParent(int id, int newParentId);
        Task<Hierarchy> GetRoot(HierarchyType type);
        Task<IEnumerable<Hierarchy>> GetTree(HierarchyType type, IEnumerable<string> groups);
    }
}