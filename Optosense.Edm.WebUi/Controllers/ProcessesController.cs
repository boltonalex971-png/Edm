using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Plugins;
using Optosense.Edm.Webui.Models;

namespace Optosense.Edm.WebUi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProcessesController : ControllerBase
    {
        private readonly ILogger<ProcessesController> _logger;
        private readonly IMapper _mapper;
        private readonly IProcessService _processService;
        private readonly IPluginContainer _plugins;

        public ProcessesController(ILogger<ProcessesController> logger, IMapper mapper, IProcessService processService, IPluginContainer plugins)
        {
            _logger = logger;
            _mapper = mapper;
            _processService = processService;
            _plugins = plugins;
        }

        [HttpGet]
        public async Task<IEnumerable<Process>> Get()
        {
            return await _processService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<Process> GetById(int id)
        {
            if (id > 0)
            {
                return await _processService.Get(id);
            }
            else
            {
                return new Process
                {
                    Name = string.Empty,
                    Description = string.Empty,
                    IsActive = true
                };
            }
        }

        [HttpPut("{id:int}")]
        public async Task<Process> Save(int id, [FromBody] Process process)
        {
            if (id != process.Id)
            {
                throw new Exception("Process id is ambiguous");
            }
            var result = await _processService.Save(process);
            return result;
        }

        [HttpDelete("{id:int}")]
        public async Task<Process> DeleteProcess(int id)
        {
            var process = await _processService.Delete(id);
            return process;
        }

        [HttpPost]
        public async Task<Process> Create([FromBody] Process process)
        {
            process.Id = 0;
            var result = await _processService.Save(process);
            return result;
        }

        #region profiles

        [HttpGet("{id:int}/profiles")]
        public async Task<IEnumerable<ProfileViewModel>> GetProfiles(int id)
        {
            var profiles = await _processService.GetProfiles(id);
            var result = _mapper.Map<IEnumerable<ProfileViewModel>>(profiles);
            foreach (var profile in result)
            {
                var profiler = _plugins.GetProfile(profile.ProfilerGuid);
                profile.ProfilerName = profiler?.Name;
            }

            return result;
        }

        [HttpPost("{id:int}/profiles")]
        public async Task<ProfileViewModel> AddProfile(int id, ProfileViewModel model)
        {
            var profile = _mapper.Map<Domain.Models.Profile>(model);
            profile = await _processService.AddProfile(id, profile);
            return _mapper.Map<ProfileViewModel>(profile);
        }

        [HttpDelete("{id:int}/profiles/{profileId:int}")]
        public async Task<bool> DeleteProfile(int id, int profileId)
        {
            var wasDetached = await _processService.DeleteProfile(id, profileId);
            return wasDetached;
        }

        #endregion
    }
}
