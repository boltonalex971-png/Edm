using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Services
{
    public class ProcessService : ServiceBase<Process>, IProcessService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        private IProfileService _profileService { get; set; }
        private IHierarchyService _hierarchyService;
        #endregion

        public ProcessService() { }

        public ProcessService(EdmContext db, IProfileService profileService, IHierarchyService hierarchyService) : base(db)
        {
            _profileService = profileService;
            _hierarchyService = hierarchyService;
        }

        public async Task<IEnumerable<Process>> GetHierarchy(IEnumerable<string> groups)
        {
            var tree = await _hierarchyService.GetTree(HierarchyType.Process, groups);
            var ids = tree.Select(t => t.Id);
            var processes = await Db.Processes
                .Where(p => ids.Contains(p.HierarchyId))
                .ToListAsync();
            return processes;
        }

        public async Task<Process> ChangeParent(int id, int newParentId)
        {
            var process = await Db.Processes.FindAsync(id);
            var folder = await _hierarchyService.Get(newParentId);
            if (folder == null)
            {
                throw new Microprojects.Edm.EdmException($"Hierarchy folder with Id {newParentId} not found");
            }

            process.HierarchyId = folder.Id;
            await Db.SaveChangesAsync();
            return process;
        }

        public override async Task<Process> Delete(int id)
        {
            var process = await Get(id);
            return await Delete(process);
        }

        public async Task<IEnumerable<Profile>> GetProfiles(int id)
        {
            var profiles = await Db.Profiles
                .Where(p => p.ProcessId == id)
                .ToListAsync();
            return profiles;
        }

        public async Task<IEnumerable<string>> GetMissingInputs(int id)
        {
            var profiles = await GetProfiles(id);
            var inputs = profiles.SelectMany(p => JsonConvert.DeserializeObject<string[]>(p.Input ?? "[]")).Distinct();
            var outputs = profiles.SelectMany(p => JsonConvert.DeserializeObject<string[]>(p.Output ?? "[]")).Distinct();
            var missing = inputs.Except(outputs);
            return missing;
        }

        public async Task<Profile> AddProfile(int id, Profile profile)
        {
            var process = await Db.Processes
                .Include(p => p.Profiles)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive) ?? throw new ArgumentException("Process not found");
            profile.IsActive = true;
            process.Profiles.Add(profile);
            await Db.SaveChangesAsync();
            return profile;
        }

        public async Task<bool> DeleteProfile(int id, int profileId)
        {
            var process = await Db.Processes
                .Include(p => p.Profiles)
                .FirstOrDefaultAsync(p => p.Id == id) ?? throw new ArgumentException("Process not found");
            var profile = process.Profiles.FirstOrDefault(p => p.Id == profileId) ??
                throw new ArgumentException("Profile not found");
            process.Profiles.Remove(profile);
            await Db.SaveChangesAsync();
            return true;
        }


        #region qualifiers
        public async Task<IEnumerable<Qualifier>> GetQualifiers(int id)
        {
            var qualifier = await Db.Qualifiers
                .Where(p => p.ProcessId == id)
                .ToListAsync();
            return qualifier;
        }

        public async Task<Qualifier> AddQualifier(int id, Qualifier qualifier)
        {
            var process = await Db.Processes
                .Include(p => p.Qualifiers)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive) ?? throw new ArgumentException("Process not found");
            qualifier.IsActive = true;
            process.Qualifiers.Add(qualifier);
            await Db.SaveChangesAsync();
            return qualifier;
        }

        public async Task<bool> DeleteQualifier(int id, int qualifierId)
        {
            var process = await Db.Processes
                .Include(p => p.Qualifiers)
                .FirstOrDefaultAsync(p => p.Id == id) ?? throw new ArgumentException("Process not found");
            var qualifier = process.Qualifiers.FirstOrDefault(p => p.Id == qualifierId) ??
                throw new ArgumentException("Profile not found");
            process.Qualifiers.Remove(qualifier);
            await Db.SaveChangesAsync();
            return true;
        }

        public async Task<Qualifier> SaveQualifier(Qualifier qualifier)
        {
            var result = await Save(qualifier);
            return result;
        }
        #endregion

    }
}
