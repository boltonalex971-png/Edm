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

namespace Microprojects.Edm.Ui.Logistics.Services
{
    public class DirectoryService : ServiceBase<Directory>, IDirectoryService
    {
        public DirectoryService(LogisticsContext db) : base(db)
        {
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

        public async Task<IEnumerable<Directory>> GetTree(string entryType, IEnumerable<string> groups)
        {
            var folder = await Db.Directories.AsNoTracking()
                .Include(d => d.Meta)
                //.Include(d => d.Children)
                .Where(d => 
                    d.Meta.Deleted == null && 
                    (d.Meta.Groups == null || groups == null || d.Meta.Groups.Length == 0 || d.Meta.Groups.Any(groups.Contains)
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
