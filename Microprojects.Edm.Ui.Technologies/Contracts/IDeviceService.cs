using Microprojects.Edm.Ui.Technologies.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IDeviceService : IGenericService<Device>
    {
        Task<Device> ChangeParent(int id, int newParentId);
        Task<IEnumerable<HostDevice>> GetHosts(int id);
        Task<HostDevice> AttachHost(HostDevice hostDevice);
        Task<bool> DetachHost(int id, int hostDeviceId);
        Task<IEnumerable<Host>> GetAvailableHosts();
        Task<HostDevice> GetHostDevice(int id);
    }
}
