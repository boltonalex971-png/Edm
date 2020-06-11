using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Contracts
{
    public interface IWorkplaceService : IGenericService<Workplace>
    {
        Task<IEnumerable<WorkplaceHostDevice>> GetDevices(int workspaceId);
        Task<WorkplaceHostDevice> AttachDevice(WorkplaceHostDevice workplaceHostDevice);
        Task<IEnumerable<HostDevice>> GetAvailableHostDevices();
        Task<bool> DetachDevice(int id, int devId);
        Task<IEnumerable<WorkplaceProcess>> GetProcesses(int workspaceId);
        Task<WorkplaceProcess> AttachProcess(WorkplaceProcess workplaceProcess);
        Task<bool> DetachProcess(int id, int procId);
        Task<IEnumerable<Process>> GetAvailableProcesses();
    }
}
