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
    public class ProfileService : ServiceBase, IProfileService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        #endregion

        public ProfileService() { }

        public ProfileService(IEdmContext db) : base(db) { }

        public async Task<IEnumerable<Profile>> GetAll()
        {
            var profile = await Db.Profiles.AsNoTracking()
                .Where(p => p.IsActive)
                .ToListAsync();
            return profile;
        }

        public async Task<IEnumerable<Profile>> Get(Expression<Func<Profile, bool>> predicate)
        {
            var profiles = await Db.Profiles.Where(predicate).ToListAsync();
            return profiles;
        }

        public async Task<Profile> Get(int id)
        {
            return await Db.Profiles
                .Include(p => p.Points)
                .FirstOrDefaultAsync(p => id == p.Id);
        }

        public async Task<Profile> Save(Profile profile)
        {
            if (profile.Id > 0)
            {
                var upd = await Db.Profiles.SingleAsync(p => p.Id == profile.Id);
                upd.Name = profile.Name;
                upd.Description = profile.Description;
                upd.Model = profile.Model;
                upd.TextJson = profile.TextJson;
                upd.IsActive = true;
            }
            else
            {
                profile.IsActive = true;
                Db.Profiles.Add(profile);
            }
            await Db.SaveChangesAsync();
            return profile;
        }

        public async Task<Profile> Delete(int id)
        {
            var profile = await Get(id);
            var used = await Db.OperationHostDevices.AnyAsync(o => o.ProfileId == id);
            if (used)
            {
                profile.IsActive = false;
            }
            else
            {
                Db.Profiles.Remove(profile);
            }

            await Db.SaveChangesAsync();
            return profile;
        }

        public async Task<IEnumerable<Profile>> GetByDevice(int deviceId)
        {
            var model = (await Db.HostDevices
                .Include(hd => hd.Device)
                .FirstOrDefaultAsync(hd => hd.Id == deviceId))?.Device.Model ??
                throw new Exception($"No device with id {deviceId} found");
            var profiles = await Db.Profiles
                .Where(p => p.Model == model && p.IsActive)
                .ToListAsync();
            return profiles;
        }
    }
}
