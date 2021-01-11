using AutoMapper.QueryableExtensions;
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
    public class WorkplaceService : ServiceBase<Workplace>, IWorkplaceService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        #endregion

        public WorkplaceService() { }

        public WorkplaceService(IEdmContext db) : base(db) { }

        #region devices
        public async Task<IEnumerable<WorkplaceHostDevice>> GetDevices(int workspaceId)
        {
            var devices = await Db.WorkplaceHostDevices
                .Include(w => w.HostDevice.Device)
                .Include(w => w.HostDevice.Host)
                .Where(w => w.WorkplaceId == workspaceId)
                .ToListAsync();
            return devices;
        }

        public async Task<WorkplaceHostDevice> AttachDevice(WorkplaceHostDevice workplaceHostDevice)
        {
            var result = Db.WorkplaceHostDevices.Add(workplaceHostDevice);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<bool> DetachDevice(int id, int devId)
        {
            var dev = await Db.WorkplaceHostDevices.FindAsync(devId);
            Db.WorkplaceHostDevices.Remove(dev);
            await Db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<HostDevice>> GetAvailableHostDevices()
        {
            var hostDevices = await Db.HostDevices
                .Include(hd => hd.Host)
                .Include(hd => hd.Device)
                .Where(hd => hd.IsActive)
                .ToListAsync();
            return hostDevices;
        }
        #endregion

        #region processes
        public async Task<IEnumerable<WorkplaceProcess>> GetProcesses(int workspaceId)
        {
            var devices = await Db.WorkplaceProcesses
                .Include(w => w.Process)
                .Where(w => w.WorkplaceId == workspaceId)
                .ToListAsync();
            return devices;
        }

        public async Task<WorkplaceProcess> AttachProcess(WorkplaceProcess workplaceProcess)
        {
            var result = Db.WorkplaceProcesses.Add(workplaceProcess);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<bool> DetachProcess(int id, int procId)
        {
            var dev = await Db.WorkplaceProcesses.FindAsync(procId);
            Db.WorkplaceProcesses.Remove(dev);
            await Db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Process>> GetAvailableProcesses()
        {
            var processes = await Db.Processes
                .Where(p => p.IsActive)
                .ToListAsync();
            return processes;
        }

        #endregion

    }
}
