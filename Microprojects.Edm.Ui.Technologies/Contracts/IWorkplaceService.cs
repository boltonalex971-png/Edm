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
        Task<WorkplaceHostDevice> GetDevice(Guid workplaceDeviceId);
        Task<WorkplaceHostDevice> AttachDevice(WorkplaceHostDevice workplaceHostDevice);
        Task<IEnumerable<HostDevice>> GetAvailableHostDevices();
        Task<bool> DetachDevice(Guid id, Guid devId);
        Task<IEnumerable<WorkplaceProcess>> GetProcesses(Guid workspaceId);
        Task<WorkplaceProcess> AttachProcess(WorkplaceProcess workplaceProcess);
        Task<WorkplaceProcess> SaveWorkplaceProcess(WorkplaceProcess workplaceProcess);
        Task<bool> DetachProcess(Guid id, Guid procId);

        Task<IEnumerable<WorkplaceProcess>> GetAllowedProcesses();
        Task<IEnumerable<Process>> GetAvailableProcesses();
        Task<IEnumerable<Workbench>> GetWorkbenches(Guid workplaceProcessId);
        Task<WorkplaceProcess> GetWorkplaceProcess(Guid workplaceProcessId);
        Task<Workbench> SaveWorkbench(Workbench workbench);
        Task<Workbench> GetWorkbench(Guid workbenchId);
        Task<Workbench> DeleteWorkbench(Guid workbenchId);
        Task<WorkbenchWorkplaceHostDevice> GetWorkbenchDevice(Guid id);
        Task<IEnumerable<WorkbenchWorkplaceHostDevice>> GetWorkbenchDevices(Guid workbenchId);
        Task<WorkbenchWorkplaceHostDevice> SaveWorkbenchDevice(WorkbenchWorkplaceHostDevice device);
        Task<WorkbenchWorkplaceHostDevice> SaveWorkbenchDeviceOptions(Guid id, string options);
        Task<WorkbenchWorkplaceHostDevice> DeleteWorkbenchDevice(Guid id);
    }
}
