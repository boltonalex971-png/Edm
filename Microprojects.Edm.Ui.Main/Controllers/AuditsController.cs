using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Auditing;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Webui.Models;

namespace Optosense.Edm.WebUi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditsController : ControllerBase
    {
        private readonly ILogger<ProcessesController> _logger;
        private readonly IMapper _mapper;
        private readonly IAuditService _auditService;

        public AuditsController(ILogger<ProcessesController> logger, IMapper mapper, IAuditService auditService)
        {
            _logger = logger;
            _mapper = mapper;
            _auditService = auditService;
        }

        [HttpGet]
        public async Task<IEnumerable<Audit>> Get()
        {
            return await _auditService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<Audit> GetById(int id)
        {
            var audit = id switch
            {
                not 0 => await _auditService.Get(id),
                0 => new Audit
                {
                    Name = string.Empty,
                    Description = string.Empty,
                    IsActive = true
                }
            };
            return audit;
        }

        [HttpPut("{id:int}")]
        public async Task<Audit> Save(int id, [FromBody] Audit audit)
        {
            if (id != audit.Id)
            {
                throw new Exception("Process id is ambiguous");
            }
            var result = await _auditService.Save(audit);
            return result;
        }

        [HttpDelete("{id:int}")]
        public async Task<Audit> Delete(int id)
        {
            var audit = await _auditService.Delete(id);
            return audit;
        }

        [HttpPost]
        public async Task<Audit> Create([FromBody] Audit audit)
        {
            audit.Id = 0;
            var result = await _auditService.Save(audit);
            return result;
        }

        [HttpGet("functions")]
        public IEnumerable<AuditFuncMetadata> GetAuditFunctions()
        {
            var result = _auditService.GetAuditFunctions();
            return result;
        }

        [HttpGet("{id:int}/zones")]
        public async Task<IEnumerable<AuditZone>> GetZones(int id)
        {
            return await _auditService.GetZones(id);
        }

        [HttpPost("{id:int}/zones")]
        public async Task<AuditZone> CreateZone(int id, [FromBody] AuditZone zone)
        {
            zone.Id = 0;
            zone.AuditId = id;
            var result = await _auditService.SaveZone(zone);
            return result;
        }

        [HttpPut("zones/{id:int}")]
        public async Task<AuditZone> SaveZone(int id, [FromBody] AuditZone zone)
        {
            if (id != zone.Id)
            {
                throw new Exception("Zone id is ambiguous");
            }

            var result = await _auditService.SaveZone(zone);
            return result;
        }

        [HttpDelete("zones/{id:int}")]
        public async Task<AuditZone> DeleteZone(int id)
        {
            var result = await _auditService.DeleteZone(id);
            return result;
        }

        [HttpPost("zones/{id:int}/criteria")]
        public async Task<AuditCriterion> CreateCriterion(int id, [FromBody] AuditCriterion criterion)
        {
            criterion.Id = 0;
            criterion.ZoneId = id;
            var result = await _auditService.SaveCriterion(criterion);
            return result;
        }

        [HttpPut("criteria/{id:int}")]
        public async Task<AuditCriterion> Save(int id, [FromBody] AuditCriterion criterion)
        {
            if (id != criterion.Id)
            {
                throw new Exception("Criterion id is ambiguous");
            }

            var result = await _auditService.SaveCriterion(criterion);
            return result;
        }

        [HttpDelete("criteria/{id:int}")]
        public async Task<AuditCriterion> DeleteCriterion(int id)
        {
            var result = await _auditService.DeleteCriterion(id);
            return result;
        }
    }
}
