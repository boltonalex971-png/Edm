using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;

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
        public async Task<IEnumerable<Microprojects.Edm.Ui.Technologies.Models.Profile>> Get()
        {
            return await _profileService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<Microprojects.Edm.Ui.Technologies.Models.Profile> GetById(int id)
        {
            var profile = id switch {
                not 0 => await _profileService.Get(id),
                0 => new Microprojects.Edm.Ui.Technologies.Models.Profile
                {
                    Name = string.Empty,
                    Description = string.Empty,
                    TextJson = string.Empty,
                    IsActive = true
                }
            };
            return profile;
        }

        [HttpPut("{id:int}")]
        public async Task<Microprojects.Edm.Ui.Technologies.Models.Profile> Save(int id, [FromBody] Microprojects.Edm.Ui.Technologies.Models.Profile profile)
        {
            if (id != profile.Id)
            {
                throw new Exception("Profile ID is ambiguous");
            }
            var result = await _profileService.Save(profile);
            return result;
        }

        [HttpDelete("{id:int}")]
        public async Task<Microprojects.Edm.Ui.Technologies.Models.Profile> DeleteProfile(int id)
        {
            var profile = await _profileService.Delete(id);
            return profile;
        }

        [HttpPost]
        public async Task<Microprojects.Edm.Ui.Technologies.Models.Profile> Create([FromBody] Microprojects.Edm.Ui.Technologies.Models.Profile profile)
        {
            profile.Id = 0;
            var result = await _profileService.Save(profile);
            return result;
        }

        [HttpGet("{id:int}/params")]
        public async Task<IEnumerable<string>> GetParams(int id)
        {
            var parameters = await _profileService.GetProfileParams(id);
            return parameters;
        }

        [HttpGet("devices/{id:int}")]
        public async Task<IEnumerable<Microprojects.Edm.Ui.Technologies.Models.Profile>> GetProfilesByDeviceId(int id)
        {
            var profiles = await _profileService.GetByDevice(id);
            return profiles;
        }

        #region profiles

        [HttpGet("{id:int}/audits")]
        public async Task<IEnumerable<Audit>> GetAudits(int id)
        {
            var audits = await _profileService.GetAudits(id);
            return audits;
        }

        [HttpPost("{id:int}/audits")]
        public async Task<Audit> AddAudit(int id, Audit audit)
        {
            var newAudit = await _profileService.AddAudit(id, audit);
            return newAudit;
        }

        [HttpDelete("{id:int}/audits/{auditId:int}")]
        public async Task<bool> DeleteProfile(int id, int auditId)
        {
            var wasDetached = await _profileService.DeleteAudit(id, auditId);
            return wasDetached;
        }

        #endregion
    }
}
