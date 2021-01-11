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
