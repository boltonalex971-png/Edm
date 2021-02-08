using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Services
{
    public class ProfileService : ServiceBase<Profile>, IProfileService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        #endregion

        public ProfileService() { }

        public ProfileService(IEdmContext db) : base(db) { }

        public override async Task<Profile> Delete(int id)
        {
            var profile = await Get(id);
            var used = await Db.OperationHostDevices.AnyAsync(o => o.ProfileId == id);
            return await Delete(profile, used);
        }

        public async Task<IEnumerable<Profile>> GetByDevice(int deviceId)
        {
            var type = (await Db.HostDevices
                .Include(hd => hd.Device)
                .FirstOrDefaultAsync(hd => hd.Id == deviceId))?.Device.EnvType ??
                throw new Exception($"No device with id {deviceId} found");
            var profiles = await Db.Profiles
                .Where(p => p.Type == type && p.IsActive)
                .ToListAsync();
            return profiles;
        }

        public async Task<IEnumerable<Audit>> GetAudits(int id)
        {
            var audits = await Db.Audits
                .Where(s => s.ProfileId == id && s.IsActive)
                .ToListAsync();
            return audits;
        }

        public async Task<Audit> AddAudit(int id, Audit audit)
        {
            var profile = await Db.Profiles
                .Include(p => p.Audits)
                .FirstOrDefaultAsync(p => p.Id == id) ?? throw new ArgumentException("Profile not found");
            audit.IsActive = true;
            profile.Audits.Add(audit);
            await Db.SaveChangesAsync();
            return audit;
        }

        public async Task<bool> DeleteAudit(int id, int auditId)
        {
            var profile = await Db.Profiles
                .Include(p => p.Audits)
                .FirstOrDefaultAsync(p => p.Id == id) ?? throw new ArgumentException("Profile not found");
            var audit = profile.Audits.FirstOrDefault(p => p.Id == auditId) ??
                throw new ArgumentException("Audit not found");
            profile.Audits.Remove(audit);
            await Db.SaveChangesAsync();
            return true;
        }
    }
}
