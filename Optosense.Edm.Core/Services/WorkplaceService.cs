using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Persistence;
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

        private IHierarchyService _hierarchyService;

        public WorkplaceService() { }

        public WorkplaceService(EdmContext db, IHierarchyService hierarchyService) : base(db)
        {
            _hierarchyService = hierarchyService;
        }

        public async Task<Workplace> ChangeParent(int id, int newParentId)
        {
            var workplace = await Db.Workplaces.FindAsync(id);
            var folder = await _hierarchyService.Get(newParentId);
            if (folder == null)
            {
                throw new Microprojects.Edm.EdmException($"Hierarchy folder with Id {newParentId} not found");
            }

            workplace.HierarchyId = folder.Id;
            await Db.SaveChangesAsync();
            return workplace;
        }

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

        public async Task<WorkplaceHostDevice> GetDevice(int workplaceDeviceId)
        {
            var device = await Db.WorkplaceHostDevices
                .Include(w => w.HostDevice.Device)
                .Include(w => w.HostDevice.Host)
                .Where(w => w.Id == workplaceDeviceId)
                .FirstOrDefaultAsync();
            return device;
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
        public async Task<IEnumerable<WorkplaceProcess>> GetAllowedProcesses(IEnumerable<string> groups)
        {
            var tree = await _hierarchyService.GetTree(HierarchyType.Workplace, groups);
            var ids = tree.Select(t => t.Id);
            var processes = await Db.WorkplaceProcesses
                .Include(w => w.Workplace)
                .Include(w => w.Process)
                .Where(w => ids.Contains(w.Workplace.HierarchyId) && w.Workplace.IsActive && w.Process.IsActive)
                .ToListAsync();
            return processes;
        }

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

        public async Task<IEnumerable<Workbench>> GetWorkbenches(int workplaceProcessId)
        {
            var workbenches = await Db.Workbenches
                .Include(w => w.WorkplaceProcess.Process)
                .Include(w => w.WorkplaceProcess.Workplace)
                .Where(w => w.WorkplaceProcessId == workplaceProcessId && w.IsActive)
                .ToListAsync();
            return workbenches;
        }

        public async Task<WorkplaceProcess> GetWorkplaceProcess(int workplaceProcessId)
        {
            var result = await Db.WorkplaceProcesses
                .Include(p => p.Process.Profiles)
                .Include(p => p.Workplace)
                .FirstOrDefaultAsync(p => p.Id == workplaceProcessId) ?? throw new ArgumentException("No workspace process found");
            return result;
        }

        public async Task<Workbench> SaveWorkbench(Workbench workbench)
        {
            var result = await Save(workbench);
            return result;
        }

        public async Task<Workbench> GetWorkbench(int workbenchId)
        {
            var result = await Db.Workbenches
                .Include(w => w.WorkplaceProcess.Process)
                .Include(w => w.WorkplaceProcess.Workplace)
                .FirstOrDefaultAsync(w => w.Id == workbenchId) ?? throw new ArgumentException("Workbench not found");
            return result;
        }

        public async Task<Workbench> DeleteWorkbench(int id)
        {
            var result = await Delete<Workbench>(id);
            return result;
        }

        public async Task<IEnumerable<WorkbenchWorkplaceHostDevice>> GetWorkbenchDevices(int workbenchId)
        {
            var result = await Db.WorkbenchDeviceConfigurations
                .Include(d => d.WorkplaceHostDevice.HostDevice.Device)
                .Include(d => d.WorkplaceHostDevice.HostDevice.Host)
                .Include(d => d.Profile)
                .Where(d => d.WorkbenchId == workbenchId)
                .ToListAsync();
            return result;
        }

        public async Task<WorkbenchWorkplaceHostDevice> GetWorkbenchDevice(int id)
        {
            var result = await Db.WorkbenchDeviceConfigurations
                .Include(d => d.WorkplaceHostDevice.HostDevice.Device)
                .Include(d => d.WorkplaceHostDevice.HostDevice.Host)
                .Include(d => d.Profile)
                .FirstOrDefaultAsync(d => d.Id == id) ?? throw new ArgumentException("Workbench device configuration not found");
            return result;
        }

        public async Task<WorkbenchWorkplaceHostDevice> SaveWorkbenchDevice(WorkbenchWorkplaceHostDevice device)
        {
            var result = await Save(device);
            return result;
        }

        public async Task<WorkbenchWorkplaceHostDevice> SaveWorkbenchDeviceOptions(int id, string options)
        {
            var device = await GetWorkbenchDevice(id) ?? throw new ArgumentException("Workbench device not found");
            device.Configuration = options;
            var result = await Save(device);
            return result;
        }

        public async Task<WorkbenchWorkplaceHostDevice> DeleteWorkbenchDevice(int id)
        {
            var result = await Delete<WorkbenchWorkplaceHostDevice>(id);
            return result;
        }

        #endregion

    }
}
