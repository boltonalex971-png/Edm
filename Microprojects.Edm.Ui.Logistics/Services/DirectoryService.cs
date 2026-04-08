using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Domain.Models;
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;
using Meta = Microprojects.Edm.Ui.Logistics.Models.Meta;

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
                throw new Exception("Hierarchy folder cannot be self-referenced");
            }

            var folder = await Get(id);
            var parent = await Get(newParentId);
            if (parent == null)
            {
                throw new Exception($"Hierarchy folder with Id {newParentId} not found");
            }

            folder.DirectoryId = parent.Id;
            await Db.SaveChangesAsync();
            return folder;
        }

        public async Task<IEnumerable<Directory>> GetTree(string entryType)
        {
            var groups = UserService.GetUserGroups();
            var userName = UserService.GetUserName();
            var folder = await Db.Directories.AsNoTracking()
                .Include(d => d.Meta)
                //.Include(d => d.Children)
                .Where(d => 
                    d.Meta.Deleted == null && 
                    (
                        d.Meta.Groups == null ||
                        d.Meta.Groups.Length == 0 ||
                        (groups != null && groups.Length > 0 && d.Meta.Groups.Any(g => groups.Contains(g))) ||
                        (userName != null && d.Meta.Owner == userName)
                    )
                ).ToListAsync();
            return folder;
        }

        public async Task<Directory> GetRoot(string entryType)
        {
            return await Db.Directories
                .FirstOrDefaultAsync(d => d.Meta.Deleted != null && d.DirectoryId == Directory.GeneralRootId);
        }
    }
}