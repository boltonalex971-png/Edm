using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IHostService : IGenericService<Host>
    {
        Task<IEnumerable<HostDevice>> GetDevices(Guid hostId);
        Task<HostDevice> AttachDevice(HostDevice hostDevice);
        Task<IEnumerable<Device>> GetAvailableDevices();
        Task<bool> DetachDevice(Guid hostId, int deviceId);
        Task<HostDevice> GetHostDevice(int id);
    }
}
