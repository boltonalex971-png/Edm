using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Technologies.Auditing;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IAuditService : ILegacyIntGenericService<Audit>
    {
        Task<IEnumerable<Audit>> GetByProfile(Guid profileId);
        Task<IEnumerable<AuditZone>> GetZones(int auditId);
        Task<AuditZone> SaveZone(AuditZone zone);
        Task<AuditCriterion> SaveCriterion(AuditCriterion criterion);
        Task<AuditZone> DeleteZone(int zoneId);
        Task<AuditCriterion> DeleteCriterion(int criterionId);
        IEnumerable<AuditFuncMetadata> GetAuditFunctions();
        Task<IEnumerable<Qualifier>> GetQualifiers(int id);
        Task<IEnumerable<Qualifier>> GetProcessQualifiers(int id);
        Task<Qualifier> AddQualifier(int auditId, Qualifier qualifier);
        Task<bool> DeleteQualifier(int auditId, Guid qualifierId);
    }
}
