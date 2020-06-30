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
    public class HostService : ServiceBase, IHostService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        #endregion

        public HostService() { }

        public HostService(IEdmContext db) : base(db) { }

        public async Task<IEnumerable<Host>> GetAll()
        {
            var hosts = await Db.Hosts.AsNoTracking()
                .Where(p => p.IsActive)
                .ToListAsync();
            return hosts;
        }

        public async Task<IEnumerable<Host>> Get(Expression<Func<Host, bool>> predicate)
        {
            throw new NotImplementedException();
        }

        public async Task<Host> Get(int id)
        {
            return await Db.Hosts
                .FirstOrDefaultAsync(p => id == p.Id);
        }

        public async Task<Host> Save(Host host)
        {
            if (host.Id > 0)
            {
                var upd = await Db.Hosts.SingleAsync(p => p.Id == host.Id);
                upd.Name = host.Name;
                upd.Description = host.Description;
                upd.Port = host.Port;
                upd.Url = host.Url;
                upd.IsActive = true;
            }
            else
            {
                host.IsActive = true;
                Db.Hosts.Add(host);
            }
            await Db.SaveChangesAsync();
            return host;
        }

        public async Task<Host> Delete(int id)
        {
            var host = await Get(id);
            var used = await Db.HostDevices.AnyAsync(o => o.HostId == id);
            if (used)
            {
                host.IsActive = false;
            }
            else
            {
                Db.Hosts.Remove(host);
            }

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
            var devices = await Db.Devices
                .Where(d => d.IsActive)
                .ToListAsync();
            return devices;
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
