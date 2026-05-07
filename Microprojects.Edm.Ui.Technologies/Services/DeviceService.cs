using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class DeviceService : ServiceBase<Device>, IDeviceService
    {
        private IPluginContainer _plugins;
        private IHierarchyService _hierarchyService;

        protected DeviceService() { }

        public DeviceService(TechnologiesContext db, IHierarchyService hierarchyService, IPluginContainer plugins) : base(db)
        {
            _plugins = plugins;
            _hierarchyService = hierarchyService;
        }

        public async Task<Device> ChangeParent(int id, int newParentId)
        {
            var device = await Db.Devices.FindAsync(id);
            var folder = await _hierarchyService.Get(newParentId);
            if (folder == null)
            {
                throw new Microprojects.Edm.EdmException($"Hierarchy folder with Id {newParentId} not found");
            }

            device.HierarchyId = folder.Id;
            await Db.SaveChangesAsync();
            return device;
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

        public async Task<HostDevice> AttachHost(HostDevice hostDevice)
        {
            var result = Db.HostDevices.Add(hostDevice);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<bool> DetachHost(int id, int hostDeviceId)
        {
            var host = await Db.HostDevices.FindAsync(hostDeviceId);
            Db.HostDevices.Remove(host);
            await Db.SaveChangesAsync();
            return true;
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
