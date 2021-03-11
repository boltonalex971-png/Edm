using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Plugins;
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
        private IPluginContainer _plugins;
        protected DeviceService() { }
        public DeviceService(IEdmContext db, IPluginContainer plugins) : base(db)
        {
            _plugins = plugins;
        }

        public override async Task<Device> Get(int id)
        {
            var result = await base.Get(id);
            var driver = _plugins.GetDriver(result.DriverGuid);
            result.DriverName = driver?.Name;
            var profiler = _plugins.GetProfile(driver?.ProfileGuid ?? Guid.Empty);
            result.ProfilerGuid = profiler?.Guid ?? Guid.Empty;
            result.ProfilerName = profiler?.Name;
            return result;
        }

        public override async Task<IEnumerable<Device>> GetAll()
        {
            var devices = await base.GetAll();
            foreach (var device in devices)
            {
                var driver = _plugins.GetDriver(device.DriverGuid);
                var profiler = _plugins.GetProfile(driver?.ProfileGuid ?? Guid.Empty);
                device.DriverName = driver?.Name;
                device.ProfilerGuid = driver?.ProfileGuid ?? Guid.Empty;
                device.ProfilerName = profiler?.Name;
            }

            return devices;
        }

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
