using Microprojects.Edm;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
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
    public class HostService : ServiceBase<Host>, IHostService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        #endregion

        private IDeviceService _deviceService;
        private IHierarchyService _hierarchyService;
        private ICommandContainer _container;

        protected HostService() { }

        public HostService(IEdmContext db, ICommandContainer container, IDeviceService deviceService, IHierarchyService hierarchyService) : base(db) 
        {
            _deviceService = deviceService;
            _hierarchyService = hierarchyService;
            _container = container;
        }

        public override async Task<Host> Get(int id)
        {
            var host = await base.Get(id);
            host.IsActive = _container.Hive.GetActivePeers()
                    .Any(h => h.Host == host.Url);
            return host;
        }

        public override async Task<IEnumerable<Host>> GetAll()
        {
            var savedHosts = new List<Host>(await base.GetAll());
            foreach (var host in savedHosts)
            {
                host.IsActive = _container.Hive.GetActivePeers()
                    .Any(h => h.Host == host.Url);
            }

            var unknownHosts = _container.Hive.GetActivePeers()
                .Where(h => !savedHosts.Any(s => s.Url.StartsWith($"{h.Host}")));
            foreach (var newHost in unknownHosts)
            {
                var hostUri = new Uri($"{newHost.Host}");
                var addedHost = await Save(new Host
                {
                    HierarchyId = (await _hierarchyService.GetRoot(HierarchyType.Host)).Id,
                    IsActive = true,
                    Name = hostUri.Host,
                    Port = newHost.GrpcPort,
                    Url = newHost.Host
                });
                savedHosts.Add(addedHost);
            }

            return savedHosts;
        }

        public async Task<Host> ChangeParent(int id, int newParentId)
        {
            var host = await Db.Hosts.FindAsync(id);
            var folder = await _hierarchyService.Get(newParentId);
            if (folder == null)
            {
                throw new Microprojects.Edm.EdmException($"Hierarchy folder with Id {newParentId} not found");
            }

            host.HierarchyId = folder.Id;
            await Db.SaveChangesAsync();
            return host;
        }

        #region devices
        public async Task<IEnumerable<HostDevice>> GetDevices(int hostId)
        {
            var devices = await Db.HostDevices
                .Include(h => h.Device)
                .Where(h => h.HostId == hostId)
                .ToListAsync();
            return devices;
        }

        public async Task<HostDevice> AttachDevice(HostDevice hostDevice)
        {
            var result = Db.HostDevices.Add(hostDevice);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<bool> DetachDevice(int id, int devId)
        {
            var dev = await Db.HostDevices.FindAsync(devId);
            Db.HostDevices.Remove(dev);
            await Db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Device>> GetAvailableDevices()
        {
            return await _deviceService.GetAll();
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
