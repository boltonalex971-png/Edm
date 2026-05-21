using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class WorkplaceService : ServiceBase<TechnologiesContext, Workplace>, IWorkplaceService
    {
        public WorkplaceService(TechnologiesContext db, IUserService userService)
            : base(db, userService)
        {
        }

        public async Task<IEnumerable<WorkplaceHostDevice>> GetDevices(Guid workspaceId)
        {
            return await Db.WorkplaceHostDevices
                .Include(w => w.HostDevice.Device)
                .Include(w => w.HostDevice.Host)
                .Where(w => w.WorkplaceId == workspaceId)
                .ToListAsync();
        }

        public async Task<WorkplaceHostDevice> GetDevice(int workplaceDeviceId)
        {
            return await Db.WorkplaceHostDevices
                .Include(w => w.HostDevice.Device)
                .Include(w => w.HostDevice.Host)
                .FirstOrDefaultAsync(w => w.Id == workplaceDeviceId);
        }

        public async Task<WorkplaceHostDevice> AttachDevice(WorkplaceHostDevice workplaceHostDevice)
        {
            var result = Db.WorkplaceHostDevices.Add(workplaceHostDevice);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<bool> DetachDevice(Guid id, int devId)
        {
            var dev = await Db.WorkplaceHostDevices.FindAsync(devId);
            Db.WorkplaceHostDevices.Remove(dev);
            await Db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<HostDevice>> GetAvailableHostDevices()
        {
            return await Db.HostDevices
                .Include(hd => hd.Host)
                .Include(hd => hd.Device)
                .Where(hd => hd.IsActive)
                .ToListAsync();
        }

        public async Task<IEnumerable<WorkplaceProcess>> GetAllowedProcesses()
        {
            // Pre-Phase-C used HierarchyService to filter by user groups; the
            // shared ServiceBase / DirectoryService folds group filtering into
            // its own pipeline. Until callers move to the shared tree endpoint
            // we just return all active workplace-process links.
            return await Db.WorkplaceProcesses
                .Include(w => w.Workplace).ThenInclude(w => w.Meta)
                .Include(w => w.Process).ThenInclude(p => p.Meta)
                .Where(w => w.Workplace.Meta.Deleted == null && w.Process.Meta.Deleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<WorkplaceProcess>> GetProcesses(Guid workspaceId)
        {
            return await Db.WorkplaceProcesses
                .Include(w => w.Process.Profiles)
                .Where(w => w.WorkplaceId == workspaceId)
                .ToListAsync();
        }

        public async Task<WorkplaceProcess> AttachProcess(WorkplaceProcess workplaceProcess)
        {
            var result = Db.WorkplaceProcesses.Add(workplaceProcess);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<WorkplaceProcess> SaveWorkplaceProcess(WorkplaceProcess workplaceProcess)
        {
            var track = Db.WorkplaceProcesses.Attach(workplaceProcess);
            track.State = workplaceProcess.Id == 0 ? EntityState.Added : EntityState.Modified;
            await Db.SaveChangesAsync();
            return workplaceProcess;
        }

        public async Task<bool> DetachProcess(Guid id, int procId)
        {
            var dev = await Db.WorkplaceProcesses.FindAsync(procId);
            Db.WorkplaceProcesses.Remove(dev);
            await Db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Process>> GetAvailableProcesses()
        {
            return await Db.Processes
                .Include(p => p.Meta)
                .Where(p => p.Meta.Deleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Workbench>> GetWorkbenches(int workplaceProcessId)
        {
            return await Db.Workbenches
                .Include(w => w.WorkplaceProcess.Process)
                .Include(w => w.WorkplaceProcess.Workplace)
                .Where(w => w.WorkplaceProcessId == workplaceProcessId && w.IsActive)
                .ToListAsync();
        }

        public async Task<WorkplaceProcess> GetWorkplaceProcess(int workplaceProcessId)
        {
            return await Db.WorkplaceProcesses
                .Include(p => p.Process.Profiles)
                .Include(p => p.Workplace)
                .FirstOrDefaultAsync(p => p.Id == workplaceProcessId)
                ?? throw new ArgumentException("No workspace process found");
        }

        public async Task<Workbench> SaveWorkbench(Workbench workbench)
        {
            var track = Db.Workbenches.Attach(workbench);
            track.State = workbench.Id == 0 ? EntityState.Added : EntityState.Modified;
            if (track.State == EntityState.Added)
            {
                workbench.IsActive = true;
            }
            await Db.SaveChangesAsync();
            return workbench;
        }

        public async Task<Workbench> GetWorkbench(int workbenchId)
        {
            return await Db.Workbenches
                .Include(w => w.WorkplaceProcess.Process)
                .Include(w => w.WorkplaceProcess.Workplace)
                .FirstOrDefaultAsync(w => w.Id == workbenchId)
                ?? throw new ArgumentException("Workbench not found");
        }

        public async Task<Workbench> DeleteWorkbench(int id)
        {
            var entity = await Db.Workbenches.FindAsync(id);
            if (entity != null)
            {
                entity.IsActive = false;
                await Db.SaveChangesAsync();
            }
            return entity;
        }

        public async Task<IEnumerable<WorkbenchWorkplaceHostDevice>> GetWorkbenchDevices(int workbenchId)
        {
            return await Db.WorkbenchDeviceConfigurations
                .Include(d => d.WorkplaceHostDevice.HostDevice.Device)
                .Include(d => d.WorkplaceHostDevice.HostDevice.Host)
                .Include(d => d.Profile)
                .Where(d => d.WorkbenchId == workbenchId)
                .ToListAsync();
        }

        public async Task<WorkbenchWorkplaceHostDevice> GetWorkbenchDevice(int id)
        {
            return await Db.WorkbenchDeviceConfigurations
                .Include(d => d.WorkplaceHostDevice.HostDevice.Device)
                .Include(d => d.WorkplaceHostDevice.HostDevice.Host)
                .Include(d => d.Profile)
                .FirstOrDefaultAsync(d => d.Id == id)
                ?? throw new ArgumentException("Workbench device configuration not found");
        }

        public async Task<WorkbenchWorkplaceHostDevice> SaveWorkbenchDevice(WorkbenchWorkplaceHostDevice device)
        {
            var track = Db.WorkbenchDeviceConfigurations.Attach(device);
            track.State = device.Id == 0 ? EntityState.Added : EntityState.Modified;
            await Db.SaveChangesAsync();
            return device;
        }

        public async Task<WorkbenchWorkplaceHostDevice> SaveWorkbenchDeviceOptions(int id, string options)
        {
            var device = await GetWorkbenchDevice(id);
            device.Configuration = options;
            return await SaveWorkbenchDevice(device);
        }

        public async Task<WorkbenchWorkplaceHostDevice> DeleteWorkbenchDevice(int id)
        {
            var entity = await Db.WorkbenchDeviceConfigurations.FindAsync(id);
            if (entity != null)
            {
                Db.WorkbenchDeviceConfigurations.Remove(entity);
                await Db.SaveChangesAsync();
            }
            return entity;
        }
    }
}
