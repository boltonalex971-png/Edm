using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IDeviceService : IGenericService<Device>
    {
        Task<IEnumerable<HostDevice>> GetHosts(Guid id);
        Task<HostDevice> AttachHost(HostDevice hostDevice);
        Task<bool> DetachHost(Guid id, int hostDeviceId);
        Task<IEnumerable<Host>> GetAvailableHosts();
        Task<HostDevice> GetHostDevice(int id);
    }
}
