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
        private readonly IQualifierService _qualifierService;

        public ProcessService(TechnologiesContext db, IUserService userService,
            IProfileService profileService, IQualifierService qualifierService)
            : base(db, userService)
        {
            _profileService = profileService;
            _qualifierService = qualifierService;
        }

        public async Task<IEnumerable<Profile>> GetProfiles(Guid id)
        {
            return await Db.Profiles
                .Include(p => p.Meta)
                .Where(p => p.ProcessId == id && p.Meta.Deleted == null)
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
            profile.ProcessId = id;
            return await _profileService.Save(profile);
        }

        public async Task<Profile> SaveProfile(Profile profile) => await _profileService.Save(profile);

        public async Task<bool> DeleteProfile(Guid id, Guid profileId)
        {
            var profile = await _profileService.Get(profileId);
            if (profile is null || profile.ProcessId != id)
            {
                throw new ArgumentException("Profile not found for the given process");
            }
            await _profileService.Delete(profileId);
            return true;
        }

        public async Task<IEnumerable<Qualifier>> GetQualifiers(Guid id)
        {
            return await Db.Qualifiers
                .Include(q => q.Meta)
                .Where(q => q.ProcessId == id && q.Meta.Deleted == null)
                .ToListAsync();
        }

        public async Task<Qualifier> AddQualifier(Guid id, Qualifier qualifier)
        {
            qualifier.ProcessId = id;
            return await _qualifierService.Save(qualifier);
        }

        public async Task<bool> DeleteQualifier(Guid id, Guid qualifierId)
        {
            var qualifier = await _qualifierService.Get(qualifierId);
            if (qualifier is null || qualifier.ProcessId != id)
            {
                throw new ArgumentException("Qualifier not found for the given process");
            }
            await _qualifierService.Delete(qualifierId);
            return true;
        }

        public async Task<Qualifier> SaveQualifier(Qualifier qualifier) => await _qualifierService.Save(qualifier);
    }
}
