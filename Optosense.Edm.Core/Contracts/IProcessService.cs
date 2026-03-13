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
        Task<IEnumerable<string>> GetMissingInputs(int id);
        Task<Profile> AddProfile(int processId, Profile profile);
        Task<Profile> SaveProfile(Profile profile);
        Task<bool> DeleteProfile(int processId, int profileId);

        Task<IEnumerable<Qualifier>> GetQualifiers(int id);
        Task<Qualifier> AddQualifier(int processId, Qualifier qualifier);
        Task<Qualifier> SaveQualifier(Qualifier qualifier);
        Task<bool> DeleteQualifier(int processId, int qualifierId);
    }
}
