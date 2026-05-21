using Microprojects.Edm;
using Microsoft.EntityFrameworkCore;
using Microprojects.Edm.Ui.Technologies.Auditing;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class AuditService : ServiceBase<Audit>, IAuditService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        #endregion

        public AuditService() { }

        public AuditService(TechnologiesContext db) : base(db) { }

        public async Task<IEnumerable<Audit>> GetByProfile(int profileId)
        {
            var audits = await Set()
                .Where(a => a.ProfileId == profileId && a.IsActive)
                .ToListAsync();

            return audits;
        }
        public async Task<IEnumerable<AuditZone>> GetZones(int auditId)
        {
            var zones = await Db.AuditZones
                .Include(z => z.Criteria)
                .Where(z => z.AuditId == auditId)
                .ToListAsync();
            return zones;
        }

        public async Task<AuditZone> SaveZone(AuditZone zone)
        {
            var result = await Save(zone);
            return result;
        }

        public async Task<AuditCriterion> SaveCriterion(AuditCriterion criterion)
        {
            var result = await Save(criterion);
            return result;
        }

        public async Task<AuditZone> DeleteZone(int zoneId)
        {
            // TODO must check if related criteria are not referenced by measures
            //      otherwise make soft delete of all (or just make audit versioned)
            var result = await Delete<AuditZone>(zoneId);
            return result;
        }

        public async Task<AuditCriterion> DeleteCriterion(int criterionId)
        {
            var result = await Delete<AuditCriterion>(criterionId);
            return result;
        }

        public IEnumerable<AuditFuncMetadata> GetAuditFunctions()
        {
            var funcs = AuditFunctions.GetAnalysisFunctions();
            return funcs;
        }

        public async Task<IEnumerable<Qualifier>> GetProcessQualifiers(int auditId)
        {
            var audit = await Get(auditId, a => a.Profile.Process.Qualifiers) ?? 
                throw new EdmException("Technologies.Audit.NotFound", "No audit found.");
            return audit.Profile.Process.Qualifiers;
        }

        public async Task<IEnumerable<Qualifier>> GetQualifiers(int id)
        {
            var audit = await Get(id, a => a.Qualifiers) ?? throw new EdmException("Technologies.Audit.NotFound", "No audit found.");
            return audit.Qualifiers;
        }

        public async Task<Qualifier> AddQualifier(int auditId, Qualifier qualifier)
        {
            var audit = await Get(auditId, a => a.Qualifiers) ??
                throw new EdmException("Technologies.Audit.NotFound", "No audit found.");
            var chosen = (await GetProcessQualifiers(auditId)).FirstOrDefault(q => q.Id == qualifier.Id) ??
                throw new EdmException("Technologies.Audit.QualifierMismatch", "Specified qualifier does not belong to an appropriate process.");
            audit.Qualifiers.Add(chosen);
            await Db.SaveChangesAsync();
            return qualifier;
        }

        public async Task<bool> DeleteQualifier(int auditId, int qualifierId)
        {
            var audit = await Get(auditId, a => a.Qualifiers) ??
                throw new EdmException("Technologies.Audit.NotFound", "No audit found.");
            var chosen = audit.Qualifiers.FirstOrDefault(q => q.Id == qualifierId) ??
                throw new EdmException("Technologies.Audit.QualifierMismatch", "Specified qualifier does not belong to an appropriate process.");
            audit.Qualifiers.Remove(chosen);
            await Db.SaveChangesAsync();
            return true;
        }

    }
}
