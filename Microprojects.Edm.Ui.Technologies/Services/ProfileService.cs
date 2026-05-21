using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class ProfileService : ServiceBase<TechnologiesContext, Profile>, IProfileService
    {
        private readonly IPluginContainer _plugins;

        public ProfileService(TechnologiesContext db, IUserService userService, IPluginContainer plugins)
            : base(db, userService)
        {
            _plugins = plugins;
        }

        public override async Task<Profile> Get(Guid id)
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

        public override async Task<Profile> Delete(Guid id)
        {
            var profile = await Get(id);
            if (profile is null)
            {
                return null;
            }
            // Always soft-delete via Meta.Deleted (the base does it).
            return await base.Delete(id);
        }

        public async Task<IEnumerable<Profile>> GetByDevice(int deviceId)
        {
            var profiler = (await Db.HostDevices
                .Include(hd => hd.Device)
                .FirstOrDefaultAsync(hd => hd.Id == deviceId))?.Device.ProfilerGuid
                ?? throw new Exception($"No device with id {deviceId} found");
            return await Db.Profiles
                .Include(p => p.Meta)
                .Where(p => p.ProfilerGuid == profiler && p.Meta.Deleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<string>> GetProfileParams(Guid id)
        {
            var profile = await Get(id);
            var outputParams = JsonConvert.DeserializeObject<IEnumerable<string>>(profile.Output ?? "[]");
            var plugin = _plugins.GetProfile(profile.ProfilerGuid);
            var parameters = plugin?.GetParameters(profile.TextJson);
            return outputParams.Concat(parameters);
        }

        public async Task<IEnumerable<Audit>> GetAudits(Guid id)
        {
            return await Db.Audits
                .Where(s => s.ProfileId == id && s.IsActive)
                .ToListAsync();
        }

        public async Task<Audit> AddAudit(Guid id, Audit audit)
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

        public async Task<bool> DeleteAudit(Guid id, int auditId)
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
