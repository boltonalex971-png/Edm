using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface IDirectoryService : IGenericService<Directory>
{
    Task<Directory> ChangeParent(Guid id, Guid newParentId);

    Task<Directory?> GetRoot(Guid rootId);

    Task<IEnumerable<Directory>> GetSubtreeFolders(Guid rootId);

    Task<Guid?> ResolveTypeRoot(Guid folderId);
}
