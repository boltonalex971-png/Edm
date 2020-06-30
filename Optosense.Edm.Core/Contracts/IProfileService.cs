using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Contracts
{
    public interface IProfileService : IGenericService<Profile>
    {
        Task<IEnumerable<Profile>> GetByDevice(int deviceId);
    }
}
