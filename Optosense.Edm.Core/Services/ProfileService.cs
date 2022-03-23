using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Persistence;
using Optosense.Edm.Plugins;
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

        #endregion

        private readonly IPluginContainer _plugins;

        public ProfileService() { }

        public ProfileService(EdmContext db, IPluginContainer plugins) : base(db) 
        {
            _plugins = plugins;
        }

        public override async Task<Profile> Get(int id)
        {
            var result = await base.Get(id);
            var profiler = _plugins.GetProfile(result.ProfilerGuid);
            result.ProfilerName = profiler?.Name;
            return result;
        }

        public override async Task<Profile> Delete(int id)
        {
            var profile = await Get(id);
            var used = await Db.OperationHostDevices.AnyAsync(o => o.ProfileId == id);
            return await Delete(profile, used);
        }

        public async Task<IEnumerable<Profile>> GetByDevice(int deviceId)
        {
            var profiler = (await Db.HostDevices
                .Include(hd => hd.Device)
                .FirstOrDefaultAsync(hd => hd.Id == deviceId))?.Device.ProfilerGuid ??
                throw new Exception($"No device with id {deviceId} found");
            var profiles = await Db.Profiles
                .Where(p => p.ProfilerGuid == profiler && p.IsActive)
                .ToListAsync();
            return profiles;
        }

        public async Task<IEnumerable<string>> GetProfileParams(int id)
        {
            var profile = await Get(id);
            var outputParams = JsonConvert.DeserializeObject<IEnumerable<string>>(profile.Output ?? "[]");
            var plugin = _plugins.GetProfile(profile.ProfilerGuid);
            var parameters = plugin?.GetParameters(profile.TextJson);
            return outputParams.Concat(parameters);
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
