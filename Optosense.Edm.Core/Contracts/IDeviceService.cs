using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Contracts
{
    public interface IDeviceService : IGenericService<Device>
    {
        Task<IEnumerable<HostDevice>> GetHosts(int id);
        Task<IEnumerable<Host>> GetAvailableHosts();
        Task<HostDevice> GetHostDevice(int id);
    }
}
