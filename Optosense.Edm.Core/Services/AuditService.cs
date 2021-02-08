using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Auditing;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Services
{
    public class AuditService : ServiceBase<Audit>, IAuditService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        #endregion

        public AuditService() { }

        public AuditService(IEdmContext db) : base(db) { }

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
    }
}
