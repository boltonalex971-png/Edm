using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IProfileService : ILegacyIntGenericService<Profile>
    {
        Task<IEnumerable<string>> GetProfileParams(int id);
        Task<IEnumerable<Profile>> GetByDevice(int deviceId);
        Task<IEnumerable<Audit>> GetAudits(int id);
        Task<Audit> AddAudit(int id, Audit audit);
        Task<bool> DeleteAudit(int id, int auditId);
    }
}
