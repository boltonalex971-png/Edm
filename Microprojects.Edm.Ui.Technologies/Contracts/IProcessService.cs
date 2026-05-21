using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IProcessService : IGenericService<Process>
    {
        Task<IEnumerable<Profile>> GetProfiles(Guid id);
        Task<IEnumerable<string>> GetMissingInputs(Guid id);
        Task<Profile> AddProfile(Guid processId, Profile profile);
        Task<Profile> SaveProfile(Profile profile);
        Task<bool> DeleteProfile(Guid processId, Guid profileId);

        Task<IEnumerable<Qualifier>> GetQualifiers(Guid id);
        Task<Qualifier> AddQualifier(Guid processId, Qualifier qualifier);
        Task<Qualifier> SaveQualifier(Qualifier qualifier);
        Task<bool> DeleteQualifier(Guid processId, Guid qualifierId);
    }
}
