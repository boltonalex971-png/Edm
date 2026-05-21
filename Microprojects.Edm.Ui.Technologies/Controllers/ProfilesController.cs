using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Microprojects.Edm.Ui.Technologies.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
    public class ProfilesController : ControllerBase
    {
        private readonly ILogger<ProfilesController> _logger;
        private readonly IProfileService _profileService;

        public ProfilesController(ILogger<ProfilesController> logger, IProfileService profileService)
        {
            _logger = logger;
            _profileService = profileService;
        }

        [HttpGet]
        public async Task<IEnumerable<Profile>> Get() => await _profileService.GetAll();

        [HttpGet("{id:guid}")]
        public async Task<Profile> GetById(Guid id)
        {
            if (id != Guid.Empty)
            {
                return await _profileService.Get(id);
            }
            return new Profile
            {
                Name = string.Empty,
                Description = string.Empty,
                TextJson = string.Empty,
                Meta = null!,
            };
        }

        [HttpPut("{id:guid}")]
        public async Task<Profile> Save(Guid id, [FromBody] Profile profile)
        {
            if (id != profile.Id)
            {
                throw new Exception("Profile ID is ambiguous");
            }
            return await _profileService.Save(profile);
        }

        [HttpDelete("{id:guid}")]
        public async Task<Profile> DeleteProfile(Guid id) => await _profileService.Delete(id);

        [HttpPost]
        public async Task<Profile> Create([FromBody] Profile profile)
        {
            profile.Id = Guid.Empty;
            profile.Meta = null!;
            return await _profileService.Save(profile);
        }

        [HttpGet("{id:guid}/params")]
        public async Task<IEnumerable<string>> GetParams(Guid id) =>
            await _profileService.GetProfileParams(id);

        [HttpGet("devices/{id:guid}")]
        public async Task<IEnumerable<Profile>> GetProfilesByDeviceId(Guid id) =>
            await _profileService.GetByDevice(id);

        [HttpGet("{id:guid}/audits")]
        public async Task<IEnumerable<Audit>> GetAudits(Guid id) =>
            await _profileService.GetAudits(id);

        [HttpPost("{id:guid}/audits")]
        public async Task<Audit> AddAudit(Guid id, Audit audit) =>
            await _profileService.AddAudit(id, audit);

        [HttpDelete("{id:guid}/audits/{auditId:guid}")]
        public async Task<bool> DeleteProfile(Guid id, Guid auditId) =>
            await _profileService.DeleteAudit(id, auditId);
    }
}
