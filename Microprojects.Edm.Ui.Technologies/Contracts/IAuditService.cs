using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Ui.Technologies.Auditing;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface IAuditService : IGenericService<Audit>
    {
        Task<IEnumerable<Audit>> GetByProfile(Guid profileId);
        Task<IEnumerable<AuditZone>> GetZones(Guid auditId);
        Task<AuditZone> SaveZone(AuditZone zone);
        Task<AuditCriterion> SaveCriterion(AuditCriterion criterion);
        Task<AuditZone> DeleteZone(Guid zoneId);
        Task<AuditCriterion> DeleteCriterion(Guid criterionId);
        IEnumerable<AuditFuncMetadata> GetAuditFunctions();
        Task<IEnumerable<Qualifier>> GetQualifiers(Guid id);
        Task<IEnumerable<Qualifier>> GetProcessQualifiers(Guid id);
        Task<Qualifier> AddQualifier(Guid auditId, Qualifier qualifier);
        Task<bool> DeleteQualifier(Guid auditId, Guid qualifierId);
    }
}
