using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Contracts
{
    public interface IWorkplaceService : IGenericService<Workplace>
    {
        Task<Workplace> ChangeParent(int id, int newParentId);
        Task<IEnumerable<WorkplaceHostDevice>> GetDevices(int workspaceId);
        Task<WorkplaceHostDevice> GetDevice(int workplaceDeviceId);
        Task<WorkplaceHostDevice> AttachDevice(WorkplaceHostDevice workplaceHostDevice);
        Task<IEnumerable<HostDevice>> GetAvailableHostDevices();
        Task<bool> DetachDevice(int id, int devId);
        Task<IEnumerable<WorkplaceProcess>> GetProcesses(int workspaceId);
        Task<WorkplaceProcess> AttachProcess(WorkplaceProcess workplaceProcess);
        Task<bool> DetachProcess(int id, int procId);
        Task<IEnumerable<WorkplaceProcess>> GetAllowedProcesses(IEnumerable<string> groups);
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
