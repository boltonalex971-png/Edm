using Optosense.Edm.Core.Auditing;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Contracts
{
    public interface IAuditService : IGenericService<Audit>
    {
        Task<IEnumerable<Audit>> GetByProfile(int profileId);
        Task<IEnumerable<AuditZone>> GetZones(int auditId);
        Task<AuditZone> SaveZone(AuditZone zone);
        Task<AuditCriterion> SaveCriterion(AuditCriterion criterion);
        Task<AuditZone> DeleteZone(int zoneId);
        Task<AuditCriterion> DeleteCriterion(int criterionId);
        IEnumerable<AuditFuncMetadata> GetAuditFunctions();

    }
}
