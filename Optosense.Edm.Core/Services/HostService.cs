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

        protected HostService() { }

        public HostService(IEdmContext db, IDeviceService deviceService) : base(db) 
        {
            _deviceService = deviceService;
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
