using Microprojects.Edm.Ui.Technologies.Models;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IHostService : IGenericService<Host>
    {
        Task<Host> ChangeParent(int id, int newParentId);
        Task<IEnumerable<HostDevice>> GetDevices(int hostId);
        Task<HostDevice> AttachDevice(HostDevice hostDevice);
        Task<IEnumerable<Device>> GetAvailableDevices();
        Task<bool> DetachDevice(int hostId, int deviceId);
        Task<HostDevice> GetHostDevice(int id);
    }
}
