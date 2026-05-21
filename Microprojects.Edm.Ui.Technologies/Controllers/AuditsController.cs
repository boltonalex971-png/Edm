using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Shared.ViewModels;
using Microprojects.Edm.Ui.Technologies.Auditing;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Microprojects.Edm.Ui.Technologies.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
    public class AuditsController : ControllerBase
    {
        private readonly ILogger<ProcessesController> _logger;
        private readonly IAuditService _auditService;

        public AuditsController(ILogger<ProcessesController> logger, IAuditService auditService)
        {
            _logger = logger;
            _auditService = auditService;
        }

        [HttpGet]
        public async Task<IEnumerable<Audit>> Get() => await _auditService.GetAll();

        [HttpGet("{id:guid}")]
        public async Task<Audit> GetById(Guid id)
        {
            if (id != Guid.Empty)
            {
                return await _auditService.Get(id);
            }
            return new Audit
            {
                Name = string.Empty,
                Description = string.Empty,
                Meta = null!,
            };
        }

        [HttpPut("{id:guid}")]
        public async Task<Audit> Save(Guid id, [FromBody] Audit audit)
        {
            if (id != audit.Id)
            {
                throw new Exception("Audit id is ambiguous");
            }
            return await _auditService.Save(audit);
        }

        [HttpDelete("{id:guid}")]
        public async Task<Audit> Delete(Guid id) => await _auditService.Delete(id);

        [HttpPost]
        public async Task<Audit> Create([FromBody] Audit audit)
        {
            audit.Id = Guid.Empty;
            audit.Meta = null!;
            return await _auditService.Save(audit);
        }

        [HttpGet("functions")]
        public IEnumerable<AuditFuncMetadata> GetAuditFunctions() => _auditService.GetAuditFunctions();

        [HttpGet("{id:guid}/zones")]
        public async Task<IEnumerable<AuditZone>> GetZones(Guid id) => await _auditService.GetZones(id);

        [HttpPost("{id:guid}/zones")]
        public async Task<AuditZone> CreateZone(Guid id, [FromBody] AuditZone zone)
        {
            zone.Id = Guid.Empty;
            zone.AuditId = id;
            return await _auditService.SaveZone(zone);
        }

        [HttpPut("zones/{id:guid}")]
        public async Task<AuditZone> SaveZone(Guid id, [FromBody] AuditZone zone)
        {
            if (id != zone.Id)
            {
                throw new Exception("Zone id is ambiguous");
            }
            return await _auditService.SaveZone(zone);
        }

        [HttpDelete("zones/{id:guid}")]
        public async Task<AuditZone> DeleteZone(Guid id) => await _auditService.DeleteZone(id);

        [HttpPost("zones/{id:guid}/criteria")]
        public async Task<AuditCriterion> CreateCriterion(Guid id, [FromBody] AuditCriterion criterion)
        {
            criterion.Id = Guid.Empty;
            criterion.ZoneId = id;
            return await _auditService.SaveCriterion(criterion);
        }

        [HttpPut("criteria/{id:guid}")]
        public async Task<AuditCriterion> Save(Guid id, [FromBody] AuditCriterion criterion)
        {
            if (id != criterion.Id)
            {
                throw new Exception("Criterion id is ambiguous");
            }
            return await _auditService.SaveCriterion(criterion);
        }

        [HttpDelete("criteria/{id:guid}")]
        public async Task<AuditCriterion> DeleteCriterion(Guid id) => await _auditService.DeleteCriterion(id);

        [HttpGet("{id:guid}/qualifiers")]
        public async Task<IEnumerable<QualifierViewModel>> GetQualifiers(Guid id)
        {
            var qualifiers = await _auditService.GetQualifiers(id);
            return qualifiers.Select(q => q.ToViewModel()).ToList();
        }

        [HttpGet("{id:guid}/process/qualifiers")]
        public async Task<IEnumerable<QualifierViewModel>> GetProcessQualifiers(Guid id)
        {
            var qualifiers = await _auditService.GetProcessQualifiers(id);
            return qualifiers.Select(q => q.ToViewModel()).ToList();
        }

        [HttpPost("{id:guid}/qualifiers")]
        public async Task<QualifierViewModel> AddQualifier(Guid id, QualifierViewModel model)
        {
            var qualifier = model.ToEntity();
            qualifier = await _auditService.AddQualifier(id, qualifier);
            return qualifier.ToViewModel();
        }

        [HttpDelete("{id:guid}/qualifiers/{qualifierId:guid}")]
        public async Task<bool> DeleteQualifier(Guid id, Guid qualifierId)
        {
            return await _auditService.DeleteQualifier(id, qualifierId);
        }
    }
}
