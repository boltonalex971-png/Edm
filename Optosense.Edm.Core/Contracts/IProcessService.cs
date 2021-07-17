using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Contracts
{
    public interface IProcessService : IGenericService<Process>
    {
        Task<Process> ChangeParent(int id, int newParentId);
        Task<IEnumerable<Profile>> GetProfiles(int id);
        Task<Profile> AddProfile(int processId, Profile profile);
        Task<bool> DeleteProfile(int processId, int profileId);
    }
}
