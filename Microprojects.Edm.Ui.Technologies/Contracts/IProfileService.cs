using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IProfileService : IGenericService<Profile>
    {
        Task<IEnumerable<string>> GetProfileParams(Guid id);
        Task<IEnumerable<Profile>> GetByDevice(int deviceId);
        Task<IEnumerable<Audit>> GetAudits(Guid id);
        Task<Audit> AddAudit(Guid id, Audit audit);
        Task<bool> DeleteAudit(Guid id, Guid auditId);
    }
}
