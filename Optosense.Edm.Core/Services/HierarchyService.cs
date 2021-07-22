using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;

namespace Optosense.Edm.Core.Services
{
    public class HierarchyService : ServiceBase<Hierarchy>, IHierarchyService
    {
        public HierarchyService(IEdmContext db) : base(db)
        {
        }

        public async Task<Hierarchy> ChangeParent(int id, int newParentId)
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

            if (parent.Type != folder.Type)
            {
                throw new Exception($"Hierarchy folder {parent.Name} is not the same type");
            }

            folder.ParentId = parent.Id;
            await Db.SaveChangesAsync();
            return folder;
        }

        public async Task<IEnumerable<Hierarchy>> GetTree(HierarchyType type, UserInfo user)
        {
            var groups = user.Claims.Select(c => c.Name).ToList();
            var folder = await Db.Hierarchies
                .Where(h => h.IsActive && 
                    h.Type == type &&
                    (h.Group == null || user.Role == "Admin" || groups.Contains(h.Group))
            ).ToListAsync();
            return folder;
        }

        public async Task<Hierarchy> GetRoot(HierarchyType type)
        {
            return await Db.Hierarchies.FirstOrDefaultAsync(h => h.IsActive && h.ParentId == Hierarchy.GeneralRootId && h.Type == type);
        }
    }
}
