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

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class DeviceService : ServiceBase<TechnologiesContext, Device>, IDeviceService
    {
        private readonly IPluginContainer _plugins;

        public DeviceService(TechnologiesContext db, IUserService userService, IPluginContainer plugins)
            : base(db, userService)
        {
            _plugins = plugins;
        }

        public override async Task<Device> Get(Guid id)
        {
            var result = await base.Get(id);
            if (result == null)
            {
                return null;
            }
            var driver = _plugins.GetDriver(result.DriverGuid);
            result.DriverName = driver?.Name;
            var profiler = _plugins.GetProfile(driver?.ProfileGuid ?? Guid.Empty);
            result.ProfilerGuid = profiler?.Guid ?? Guid.Empty;
            result.ProfilerName = profiler?.Name;
            return result;
        }

        public override async Task<IEnumerable<Device>> GetAll(
            System.Linq.Expressions.Expression<Func<Device, bool>> predicate = null)
        {
            var devices = await base.GetAll(predicate);
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

        public async Task<IEnumerable<HostDevice>> GetHosts(Guid deviceId)
        {
            return await Db.HostDevices
                .Include(h => h.Host)
                .Where(h => h.DeviceId == deviceId)
                .ToListAsync();
        }

        public async Task<HostDevice> AttachHost(HostDevice hostDevice)
        {
            var result = Db.HostDevices.Add(hostDevice);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<bool> DetachHost(Guid id, int hostDeviceId)
        {
            var host = await Db.HostDevices.FindAsync(hostDeviceId);
            Db.HostDevices.Remove(host);
            await Db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Host>> GetAvailableHosts()
        {
            // Active hosts (non-deleted). Liveness is reported by HostService via
            // Host.Active, but here we only need the saved set.
            return await Db.Hosts
                .Include(h => h.Meta)
                .Where(h => h.Meta.Deleted == null)
                .ToListAsync();
        }

        public async Task<HostDevice> GetHostDevice(int id)
        {
            return await Db.HostDevices
                .Include(hd => hd.Device)
                .Include(hd => hd.Host)
                .FirstOrDefaultAsync(hd => hd.Id == id);
        }
    }
}
