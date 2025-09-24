using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface IDirectoryService : IGenericService<Directory>
{
    Task<Directory> ChangeParent(Guid id, Guid newParentId);
    Task<Directory> GetRoot(string entryType);
    Task<IEnumerable<Directory>> GetTree(string entryType);
}