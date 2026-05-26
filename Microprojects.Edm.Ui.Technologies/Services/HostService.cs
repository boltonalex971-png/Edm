using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Domain;
using Microprojects.Edm.Jobs;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class HostService : ServiceBase<TechnologiesContext, Host>, IHostService
    {
        private readonly IDeviceService _deviceService;
        private readonly IJobContainer _container;

        public HostService(TechnologiesContext db, IUserService userService, IJobContainer container,
            IDeviceService deviceService) : base(db, userService)
        {
            _deviceService = deviceService;
            _container = container;
        }

        public override async Task<IEnumerable<Host>> GetAll(
            System.Linq.Expressions.Expression<Func<Host, bool>> predicate = null)
        {
            var savedHosts = new List<Host>(await base.GetAll(predicate));
            foreach (var host in savedHosts)
            {
                host.Active = _container.Hive.GetActivePeers()
                    .Any(h => h.Host == host.Url);
            }

            var unknownHosts = _container.Hive.GetActivePeers()
                .Where(h => !savedHosts.Any(s => s.Url != null && s.Url.StartsWith($"{h.Host}")));
            foreach (var newHost in unknownHosts)
            {
                var hostUri = new Uri($"{newHost.Host}");
                var addedHost = await Save(new Host
                {
                    DirectoryId = Microprojects.Edm.Ui.Technologies.Models.WellKnownDirectoryIds.Hosts,
                    Name = hostUri.Host,
                    Port = newHost.GrpcPort,
                    Url = newHost.Host,
                    Meta = null!,
                });
                addedHost.Active = true;
                savedHosts.Add(addedHost);
            }

            return savedHosts;
        }

        public async Task<IEnumerable<HostDevice>> GetDevices(Guid hostId)
        {
            return await Db.HostDevices
                .Include(h => h.Device)
                .Where(h => h.HostId == hostId)
                .ToListAsync();
        }

        public async Task<HostDevice> AttachDevice(HostDevice hostDevice)
        {
            hostDevice.Id = DomainObject.NewGuid();
            var result = Db.HostDevices.Add(hostDevice);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<bool> DetachDevice(Guid id, Guid devId)
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

        public async Task<HostDevice> GetHostDevice(Guid id)
        {
            return await Db.HostDevices
                .Include(hd => hd.Device)
                .Include(hd => hd.Host)
                .FirstOrDefaultAsync(hd => hd.Id == id);
        }
    }
}
