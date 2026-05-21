using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Utils;
using Microprojects.Edm.Shared.ViewModels;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace Microprojects.Edm.Ui.Technologies.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
    public class ProcessesController : AuthControllerBase
    {
        private readonly ILogger<ProcessesController> _logger;
        private readonly IProcessService _processService;
        private readonly IDirectoryService _directoryService;
        private readonly IPluginContainer _plugins;

        public ProcessesController(ILogger<ProcessesController> logger, IProcessService processService,
            IDirectoryService directoryService, IPluginContainer plugins,
            IConfiguration configuration) : base(configuration)
        {
            _logger = logger;
            _processService = processService;
            _directoryService = directoryService;
            _plugins = plugins;
        }

        [HttpGet]
        public async Task<IEnumerable<Process>> Get()
        {
            return await _processService.GetAll();
        }

        [HttpGet("{id:guid}")]
        public async Task<ProcessViewModel> GetById(Guid id)
        {
            if (id != Guid.Empty)
            {
                var process = await _processService.Get(id, p => p.Profiles, p => p.Qualifiers);
                return process.ToViewModel();
            }
            return new ProcessViewModel
            {
                Name = string.Empty,
                Description = string.Empty,
            };
        }

        [HttpPut("{id:guid}")]
        public async Task<Process> Save(Guid id, [FromBody] Process process)
        {
            if (id != process.Id)
            {
                throw new Exception("Process id is ambiguous");
            }
            return await _processService.Save(process);
        }

        [HttpDelete("{id:guid}")]
        public async Task<Process> DeleteProcess(Guid id)
        {
            return await _processService.Delete(id);
        }

        [HttpPost]
        public async Task<Process> Create([FromBody] Process process)
        {
            process.Id = Guid.Empty;
            process.DirectoryId ??= WellKnownDirectoryIds.Processes;
            process.Meta = null!;
            return await _processService.Save(process);
        }

        [HttpPut("{id:guid}/parent")]
        public async Task<Process> ChangeParent(Guid id, [FromBody] DomainObjectViewModel parent)
        {
            return await _processService.ChangeParent<Process>(id, parent.Id);
        }

        [HttpGet("hierarchy")]
        public async Task<IEnumerable<DirectoryEntryViewModel>> GetProcessHierarchy()
        {
            var processes = await _processService.GetAll();
            return await DirectoryHelper.BuildEntryHierarchy(
                processes, WellKnownDirectoryIds.Processes, _directoryService, p => p.ToEntryViewModel());
        }

        #region profiles
        [HttpGet("{id:guid}/inputs")]
        public async Task<IEnumerable<string>> GetMissingInputs(Guid id) =>
            await _processService.GetMissingInputs(id);

        [HttpGet("{id:guid}/profiles")]
        public async Task<IEnumerable<ProfileViewModel>> GetProfiles(Guid id)
        {
            var profiles = await _processService.GetProfiles(id);
            var result = profiles.Select(p => p.ToViewModel()).ToList();
            foreach (var profile in result)
            {
                var profiler = _plugins.GetProfile(profile.ProfilerGuid);
                profile.ProfilerName = profiler?.Name;
            }
            return result;
        }

        [HttpPost("{id:guid}/profiles")]
        public async Task<ProfileViewModel> AddProfile(Guid id, ProfileViewModel model)
        {
            var profile = model.ToEntity();
            profile = await _processService.AddProfile(id, profile);
            return profile.ToViewModel();
        }

        [HttpPut("{id:guid}/profiles")]
        public async Task<ProfileViewModel> SaveProfile(Guid id, ProfileViewModel model)
        {
            var profile = model.ToEntity();
            profile.ProcessId = id;
            var result = await _processService.SaveProfile(profile);
            return result.ToViewModel();
        }

        [HttpDelete("{id:guid}/profiles/{profileId:guid}")]
        public async Task<bool> DeleteProfile(Guid id, Guid profileId) =>
            await _processService.DeleteProfile(id, profileId);
        #endregion

        #region qualifiers
        [HttpGet("{id:guid}/qualifiers")]
        public async Task<IEnumerable<QualifierViewModel>> GetQualifiers(Guid id)
        {
            var qualifiers = await _processService.GetQualifiers(id);
            return qualifiers.Select(q => q.ToViewModel()).ToList();
        }

        [HttpPost("{id:guid}/qualifiers")]
        public async Task<QualifierViewModel> AddQualifier(Guid id, QualifierViewModel model)
        {
            var qualifier = model.ToEntity();
            qualifier = await _processService.AddQualifier(id, qualifier);
            return qualifier.ToViewModel();
        }

        [HttpDelete("{id:guid}/qualifiers/{qualifierId:guid}")]
        public async Task<bool> DeleteQualifier(Guid id, Guid qualifierId) =>
            await _processService.DeleteQualifier(id, qualifierId);

        [HttpPut("{processId:guid}/qualifiers")]
        public async Task<QualifierViewModel> SaveQualifier(Guid processId, QualifierViewModel model)
        {
            var qualifier = model.ToEntity();
            qualifier.ProcessId = processId;
            var result = await _processService.SaveQualifier(qualifier);
            return result.ToViewModel();
        }
        #endregion
    }
}
