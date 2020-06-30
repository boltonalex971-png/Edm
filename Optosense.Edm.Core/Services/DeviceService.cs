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
    public class DeviceService : ServiceBase, IDeviceService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        #endregion

        public DeviceService() { }

        public DeviceService(IEdmContext db) : base(db) { }

        public async Task<IEnumerable<Device>> GetAll()
        {
            var devices = await Db.Devices.AsNoTracking()
                .Where(p => p.IsActive)
                .ToListAsync();
            return devices;
        }

        public async Task<IEnumerable<Device>> Get(Expression<Func<Device, bool>> predicate)
        {
            throw new NotImplementedException();
        }

        public async Task<Device> Get(int id)
        {
            return await Db.Devices
                .FirstOrDefaultAsync(p => id == p.Id);
        }

        public async Task<Device> Save(Device device)
        {
            if (device.Id > 0)
            {
                var upd = await Db.Devices.SingleAsync(d => d.Id == device.Id);
                upd.Name = device.Name;
                upd.Description = device.Description;
                upd.Model = device.Model;
                upd.Parameters = device.Parameters;
                upd.IsActive = true;
            }
            else
            {
                device.IsActive = true;
                Db.Devices.Add(device);
            }
            await Db.SaveChangesAsync();
            return device;
        }

        public async Task<Device> Delete(int id)
        {
            var device = await Get(id);
            // TODO check if device is used anywhere
            var used = false; //await Db.Operations.AnyAsync(o => o.ProcessId == id);
            if (used)
            {
                device.IsActive = false;
            }
            else
            {
                Db.Devices.Remove(device);
            }

            await Db.SaveChangesAsync();
            return device;
        }
    }
}
