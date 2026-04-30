using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Plugins;
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.Services
{
    public class DirectoryService : ServiceBase<Directory>, IDirectoryService
    {
        public DirectoryService(LogisticsContext db, IUserService userService) : base(db, userService)
        {
        }

        public override async Task<Directory> Get(Guid id)
        {
            return await Db.Directories
                .Include(d => d.Meta)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public override async Task<Directory> Save(Directory entity)
        {
            var desiredGroups = entity.Meta?.Groups ?? [];

            var saved = await base.Save(entity);

            var meta = await Db.Meta.FindAsync(saved.Id);
            if (meta != null)
            {
                meta.Groups = desiredGroups;
                meta.Modified = DateTime.UtcNow;
                await Db.SaveChangesAsync();
            }

            return saved;
        }

        public async Task<Directory> ChangeParent(Guid id, Guid newParentId)
        {
            if (id == newParentId)
            {
                throw new EdmException("Folder cannot be its own parent.");
            }

            if (id == Directory.GeneralRootId || WellKnownDirectoryIds.IsTypeRoot(id))
            {
                throw new EdmException("Built-in folders cannot be moved.");
            }

            if (newParentId == Directory.GeneralRootId)
            {
                throw new EdmException("Folders must live inside a type root, not directly under Root.");
            }

            var folder = await Get(id);
            if (folder == null)
            {
                throw new EdmException($"Folder with Id {id} not found.");
            }

            var parent = await Get(newParentId);
            if (parent == null)
            {
                throw new EdmException($"Folder with Id {newParentId} not found.");
            }

            var sourceRoot = await ResolveTypeRoot(id);
            var targetRoot = await ResolveTypeRoot(newParentId);
            if (sourceRoot is null || targetRoot is null || sourceRoot != targetRoot)
            {
                throw new EdmException("Folders cannot be moved across entry-type roots.");
            }

            folder.DirectoryId = parent.Id;
            await Db.SaveChangesAsync();
            return folder;
        }

        public async Task<Directory?> GetRoot(Guid rootId)
        {
            return await Db.Directories
                .Include(d => d.Meta)
                .FirstOrDefaultAsync(d => d.Id == rootId && d.Meta.Deleted == null);
        }

        public async Task<IEnumerable<Directory>> GetSubtreeFolders(Guid rootId)
        {
            var visible = await GetUserVisibleFolders();

            var byParent = visible
                .Where(d => d.DirectoryId.HasValue)
                .GroupBy(d => d.DirectoryId!.Value)
                .ToDictionary(g => g.Key, g => g.ToList());

            var result = new List<Directory>();
            var queue = new Queue<Guid>();

            var rootSelf = visible.FirstOrDefault(d => d.Id == rootId);
            if (rootSelf != null)
            {
                result.Add(rootSelf);
            }

            queue.Enqueue(rootId);
            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                if (!byParent.TryGetValue(current, out var children))
                {
                    continue;
                }

                foreach (var child in children)
                {
                    result.Add(child);
                    queue.Enqueue(child.Id);
                }
            }

            return result;
        }

        public async Task<Guid?> ResolveTypeRoot(Guid folderId)
        {
            if (folderId == Directory.GeneralRootId)
            {
                return null;
            }

            if (WellKnownDirectoryIds.IsTypeRoot(folderId))
            {
                return folderId;
            }

            var byId = (await GetUserVisibleFolders()).ToDictionary(d => d.Id);

            var current = folderId;
            var guard = 0;
            while (guard++ < 10_000 && byId.TryGetValue(current, out var folder))
            {
                if (WellKnownDirectoryIds.IsTypeRoot(folder.Id))
                {
                    return folder.Id;
                }

                if (!folder.DirectoryId.HasValue || folder.DirectoryId == Directory.GeneralRootId)
                {
                    return null;
                }

                current = folder.DirectoryId.Value;
            }

            return null;
        }

        private async Task<List<Directory>> GetUserVisibleFolders()
        {
            var groups = UserService.GetUserGroups();
            var userName = UserService.GetUserName();
            return await Db.Directories.AsNoTracking()
                .Include(d => d.Meta)
                .Where(d =>
                    d.Meta.Deleted == null &&
                    (
                        d.Meta.Groups == null ||
                        d.Meta.Groups.Length == 0 ||
                        (groups != null && groups.Length > 0 && d.Meta.Groups.Any(g => groups.Contains(g))) ||
                        (userName != null && d.Meta.Owner == userName)
                    )
                ).ToListAsync();
        }
    }
}
