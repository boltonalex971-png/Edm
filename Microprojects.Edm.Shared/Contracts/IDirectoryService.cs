using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Shared.Contracts;

// Plugin-agnostic directory-tree service. Each plugin's DI registers a
// concrete DirectoryService<TContext> (from Microprojects.Edm.Shared.Services)
// as the IDirectoryService for that plugin's request scope.
public interface IDirectoryService : IGenericService<Directory>
{
    Task<Directory> ChangeParent(Guid id, Guid newParentId);
    Task<Directory?> GetRoot(Guid rootId);
    Task<IEnumerable<Directory>> GetSubtreeFolders(Guid rootId);
    Task<Guid?> ResolveTypeRoot(Guid folderId);
}
