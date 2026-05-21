using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IWorkplaceService : IGenericService<Workplace>
    {
        Task<IEnumerable<WorkplaceHostDevice>> GetDevices(Guid workspaceId);
        Task<WorkplaceHostDevice> GetDevice(int workplaceDeviceId);
        Task<WorkplaceHostDevice> AttachDevice(WorkplaceHostDevice workplaceHostDevice);
        Task<IEnumerable<HostDevice>> GetAvailableHostDevices();
        Task<bool> DetachDevice(Guid id, int devId);
        Task<IEnumerable<WorkplaceProcess>> GetProcesses(Guid workspaceId);
        Task<WorkplaceProcess> AttachProcess(WorkplaceProcess workplaceProcess);
        Task<WorkplaceProcess> SaveWorkplaceProcess(WorkplaceProcess workplaceProcess);
        Task<bool> DetachProcess(Guid id, int procId);

        Task<IEnumerable<WorkplaceProcess>> GetAllowedProcesses();
        Task<IEnumerable<Process>> GetAvailableProcesses();
        Task<IEnumerable<Workbench>> GetWorkbenches(int workplaceProcessId);
        Task<WorkplaceProcess> GetWorkplaceProcess(int workplaceProcessId);
        Task<Workbench> SaveWorkbench(Workbench workbench);
        Task<Workbench> GetWorkbench(int workbenchId);
        Task<Workbench> DeleteWorkbench(int workbenchId);
        Task<WorkbenchWorkplaceHostDevice> GetWorkbenchDevice(int workbenchId);
        Task<IEnumerable<WorkbenchWorkplaceHostDevice>> GetWorkbenchDevices(int workbenchId);
        Task<WorkbenchWorkplaceHostDevice> SaveWorkbenchDevice(WorkbenchWorkplaceHostDevice device);
        Task<WorkbenchWorkplaceHostDevice> SaveWorkbenchDeviceOptions(int id, string options);
        Task<WorkbenchWorkplaceHostDevice> DeleteWorkbenchDevice(int id);
    }
}
