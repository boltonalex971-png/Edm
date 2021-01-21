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
    public class DeviceService : ServiceBase<Device>, IDeviceService
    {
        protected DeviceService() { }
        public DeviceService(IEdmContext db) : base(db) { }

        #region hosts
        public async Task<IEnumerable<HostDevice>> GetHosts(int deviceId)
        {
            var devices = await Db.HostDevices
                .Include(h => h.Host)
                .Where(h => h.DeviceId == deviceId)
                .ToListAsync();
            return devices;
        }

        public async Task<IEnumerable<Host>> GetAvailableHosts()
        {
            // TODO implement repository pattern to avoid duplicating code
            return await Db.Hosts.Where(h => h.IsActive).ToListAsync();
        }

        public async Task<HostDevice> GetHostDevice(int id)
        {
            var result = await Db.HostDevices
                .Include(hd => hd.Device)
                .Include(hd => hd.Host)
                .FirstOrDefaultAsync(hd => hd.Id == id);
            return result;
        }

        #endregion
    }
}
