using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
//using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Webui.Models;

namespace Optosense.Edm.WebUi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
        public async Task<IEnumerable<Profile>> Get()
        {
            return await _profileService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<Profile> GetById(int id)
        {
            if (id > 0)
            {
                return await _profileService.Get(id);
            }
            else
            {
                return new Profile
                {
                    Name = string.Empty,
                    Description = string.Empty,
                    Model = 0,
                    TextJson = string.Empty,
                    IsActive = true
                };
            }
        }

        [HttpPut("{id:int}")]
        public async Task<Profile> Save(int id, [FromBody] Profile profile)
        {
            if (id != profile.Id)
            {
                throw new Exception("Profile ID is ambiguous");
            }
            var result = await _profileService.Save(profile);
            return result;
        }

        [HttpDelete("{id:int}")]
        public async Task<Profile> DeleteProfile(int id)
        {
            var profile = await _profileService.Delete(id);
            return profile;
        }

        [HttpPost]
        public async Task<Profile> Create([FromBody] Profile profile)
        {
            profile.Id = 0;
            var result = await _profileService.Save(profile);
            return result;
        }

        [HttpGet("devices/{id:int}")]
        public async Task<IEnumerable<Profile>> GetProfilesByDeviceId(int id)
        {
            var profiles = await _profileService.GetByDevice(id);
            return profiles;
        }
    }
}
