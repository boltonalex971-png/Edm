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
    public class ProcessService : ServiceBase<Process>, IProcessService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        private IProfileService _profileService { get; set; }
        #endregion

        public ProcessService() { }

        public ProcessService(IEdmContext db, IProfileService profileService) : base(db) 
        {
            _profileService = profileService;
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
    }
}
