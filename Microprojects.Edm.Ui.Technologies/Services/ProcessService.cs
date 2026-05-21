using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class ProcessService : ServiceBase<TechnologiesContext, Process>, IProcessService
    {
        private readonly IProfileService _profileService;

        public ProcessService(TechnologiesContext db, IUserService userService, IProfileService profileService)
            : base(db, userService)
        {
            _profileService = profileService;
        }

        public async Task<IEnumerable<Profile>> GetProfiles(Guid id)
        {
            return await Db.Profiles
                .Where(p => p.ProcessId == id)
                .ToListAsync();
        }

        public async Task<IEnumerable<string>> GetMissingInputs(Guid id)
        {
            var profiles = await GetProfiles(id);
            var inputs = profiles.SelectMany(p => JsonConvert.DeserializeObject<string[]>(p.Input ?? "[]")).Distinct();
            var outputs = profiles.SelectMany(p => JsonConvert.DeserializeObject<string[]>(p.Output ?? "[]")).Distinct();
            return inputs.Except(outputs);
        }

        public async Task<Profile> AddProfile(Guid id, Profile profile)
        {
            var process = await Db.Processes
                .Include(p => p.Profiles)
                .Include(p => p.Meta)
                .FirstOrDefaultAsync(p => p.Id == id && p.Meta.Deleted == null)
                ?? throw new ArgumentException("Process not found");
            profile.IsActive = true;
            process.Profiles.Add(profile);
            await Db.SaveChangesAsync();
            return profile;
        }

        public async Task<Profile> SaveProfile(Profile profile)
        {
            return await _profileService.Save(profile);
        }

        public async Task<bool> DeleteProfile(Guid id, int profileId)
        {
            var process = await Db.Processes
                .Include(p => p.Profiles)
                .FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new ArgumentException("Process not found");
            var profile = process.Profiles.FirstOrDefault(p => p.Id == profileId)
                ?? throw new ArgumentException("Profile not found");
            process.Profiles.Remove(profile);
            await Db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Qualifier>> GetQualifiers(Guid id)
        {
            return await Db.Qualifiers
                .Where(p => p.ProcessId == id)
                .ToListAsync();
        }

        public async Task<Qualifier> AddQualifier(Guid id, Qualifier qualifier)
        {
            var process = await Db.Processes
                .Include(p => p.Qualifiers)
                .Include(p => p.Meta)
                .FirstOrDefaultAsync(p => p.Id == id && p.Meta.Deleted == null)
                ?? throw new ArgumentException("Process not found");
            qualifier.IsActive = true;
            process.Qualifiers.Add(qualifier);
            await Db.SaveChangesAsync();
            return qualifier;
        }

        public async Task<bool> DeleteQualifier(Guid id, int qualifierId)
        {
            var process = await Db.Processes
                .Include(p => p.Qualifiers)
                .FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new ArgumentException("Process not found");
            var qualifier = process.Qualifiers.FirstOrDefault(p => p.Id == qualifierId)
                ?? throw new ArgumentException("Qualifier not found");
            process.Qualifiers.Remove(qualifier);
            await Db.SaveChangesAsync();
            return true;
        }

        public async Task<Qualifier> SaveQualifier(Qualifier qualifier)
        {
            var track = Db.Qualifiers.Attach(qualifier);
            track.State = qualifier.Id == 0 ? EntityState.Added : EntityState.Modified;
            if (track.State == EntityState.Added)
            {
                qualifier.IsActive = true;
            }
            await Db.SaveChangesAsync();
            return qualifier;
        }
    }
}
