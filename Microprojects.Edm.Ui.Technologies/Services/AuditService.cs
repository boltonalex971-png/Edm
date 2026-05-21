using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microprojects.Edm.Ui.Technologies.Auditing;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class AuditService : ServiceBase<TechnologiesContext, Audit>, IAuditService
    {
        public AuditService(TechnologiesContext db, IUserService userService) : base(db, userService)
        {
        }

        public async Task<IEnumerable<Audit>> GetByProfile(Guid profileId)
        {
            return await Set()
                .Include(a => a.Meta)
                .Where(a => a.ProfileId == profileId && a.Meta.Deleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuditZone>> GetZones(Guid auditId)
        {
            return await Db.AuditZones
                .Include(z => z.Criteria)
                .Where(z => z.AuditId == auditId)
                .ToListAsync();
        }

        public async Task<AuditZone> SaveZone(AuditZone zone) => await Save(zone);

        public async Task<AuditCriterion> SaveCriterion(AuditCriterion criterion) => await Save(criterion);

        public async Task<AuditZone> DeleteZone(Guid zoneId) => await Delete<AuditZone>(zoneId);

        public async Task<AuditCriterion> DeleteCriterion(Guid criterionId) => await Delete<AuditCriterion>(criterionId);

        public IEnumerable<AuditFuncMetadata> GetAuditFunctions() => AuditFunctions.GetAnalysisFunctions();

        public async Task<IEnumerable<Qualifier>> GetProcessQualifiers(Guid auditId)
        {
            var audit = await Get(auditId, a => a.Profile.Process.Qualifiers)
                ?? throw new EdmException("Technologies.Audit.NotFound", "No audit found.");
            return audit.Profile.Process.Qualifiers;
        }

        public async Task<IEnumerable<Qualifier>> GetQualifiers(Guid id)
        {
            var audit = await Get(id, a => a.Qualifiers)
                ?? throw new EdmException("Technologies.Audit.NotFound", "No audit found.");
            return audit.Qualifiers;
        }

        public async Task<Qualifier> AddQualifier(Guid auditId, Qualifier qualifier)
        {
            var audit = await Get(auditId, a => a.Qualifiers)
                ?? throw new EdmException("Technologies.Audit.NotFound", "No audit found.");
            var chosen = (await GetProcessQualifiers(auditId)).FirstOrDefault(q => q.Id == qualifier.Id)
                ?? throw new EdmException("Technologies.Audit.QualifierMismatch",
                    "Specified qualifier does not belong to an appropriate process.");
            audit.Qualifiers.Add(chosen);
            await Db.SaveChangesAsync();
            return qualifier;
        }

        public async Task<bool> DeleteQualifier(Guid auditId, Guid qualifierId)
        {
            var audit = await Get(auditId, a => a.Qualifiers)
                ?? throw new EdmException("Technologies.Audit.NotFound", "No audit found.");
            var chosen = audit.Qualifiers.FirstOrDefault(q => q.Id == qualifierId)
                ?? throw new EdmException("Technologies.Audit.QualifierMismatch",
                    "Specified qualifier does not belong to an appropriate process.");
            audit.Qualifiers.Remove(chosen);
            await Db.SaveChangesAsync();
            return true;
        }
    }
}
