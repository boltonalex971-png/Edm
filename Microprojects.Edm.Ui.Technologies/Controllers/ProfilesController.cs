using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
//using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Plugins;
using Microprojects.Edm.Ui.Main.Models;

namespace Microprojects.Edm.Ui.Main.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfilesController : ControllerBase
    {
        private readonly ILogger<ProfilesController> _logger;
        private readonly IMapper _mapper;
        private readonly IProfileService _profileService;

        public ProfilesController(ILogger<ProfilesController> logger, IMapper mapper, IProfileService profileService)
        {
            _logger = logger;
            _mapper = mapper;
            _profileService = profileService;
        }

        [HttpGet]
        public async Task<IEnumerable<Optosense.Edm.Domain.Models.Profile>> Get()
        {
            return await _profileService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<Optosense.Edm.Domain.Models.Profile> GetById(int id)
        {
            var profile = id switch {
                not 0 => await _profileService.Get(id),
                0 => new Optosense.Edm.Domain.Models.Profile
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
        public async Task<Optosense.Edm.Domain.Models.Profile> Save(int id, [FromBody] Optosense.Edm.Domain.Models.Profile profile)
        {
            if (id != profile.Id)
            {
                throw new Exception("Profile ID is ambiguous");
            }
            var result = await _profileService.Save(profile);
            return result;
        }

        [HttpDelete("{id:int}")]
        public async Task<Optosense.Edm.Domain.Models.Profile> DeleteProfile(int id)
        {
            var profile = await _profileService.Delete(id);
            return profile;
        }

        [HttpPost]
        public async Task<Optosense.Edm.Domain.Models.Profile> Create([FromBody] Optosense.Edm.Domain.Models.Profile profile)
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
        public async Task<IEnumerable<Optosense.Edm.Domain.Models.Profile>> GetProfilesByDeviceId(int id)
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
