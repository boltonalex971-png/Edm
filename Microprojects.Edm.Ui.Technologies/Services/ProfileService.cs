using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class ProfileService : ServiceBase<Profile>, IProfileService
    {
        private readonly IPluginContainer _plugins;

        public ProfileService() { }

        public ProfileService(TechnologiesContext db, IPluginContainer plugins) : base(db)
        {
            _plugins = plugins;
        }

        public override async Task<Profile> Get(int id)
        {
            var result = await base.Get(id);
            if (result == null)
            {
                return null;
            }
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
                .FirstOrDefaultAsync(hd => hd.Id == deviceId))?.Device.ProfilerGuid
                ?? throw new Exception($"No device with id {deviceId} found");
            return await Db.Profiles
                .Where(p => p.ProfilerGuid == profiler && p.IsActive)
                .ToListAsync();
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
            return await Db.Audits
                .Where(s => s.ProfileId == id && s.IsActive)
                .ToListAsync();
        }

        public async Task<Audit> AddAudit(int id, Audit audit)
        {
            var profile = await Db.Profiles
                .Include(p => p.Audits)
                .FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new ArgumentException("Profile not found");
            audit.IsActive = true;
            profile.Audits.Add(audit);
            await Db.SaveChangesAsync();
            return audit;
        }

        public async Task<bool> DeleteAudit(int id, int auditId)
        {
            var profile = await Db.Profiles
                .Include(p => p.Audits)
                .FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new ArgumentException("Profile not found");
            var audit = profile.Audits.FirstOrDefault(p => p.Id == auditId)
                ?? throw new ArgumentException("Audit not found");
            profile.Audits.Remove(audit);
            await Db.SaveChangesAsync();
            return true;
        }
    }
}
