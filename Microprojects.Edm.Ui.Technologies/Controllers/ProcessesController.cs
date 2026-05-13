using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Utils;

namespace Microprojects.Edm.Ui.Technologies.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
    public class ProcessesController : AuthControllerBase
    {
        private readonly ILogger<ProcessesController> _logger;
        private readonly IProcessService _processService;
        private readonly IHierarchyService _hierarchyService;
        private readonly IPluginContainer _plugins;

        public ProcessesController(ILogger<ProcessesController> logger, IProcessService processService, IHierarchyService hierarchyService, IPluginContainer plugins, IConfiguration configuration) :
            base(configuration)
        {
            _logger = logger;
            _processService = processService;
            _hierarchyService = hierarchyService;
            _plugins = plugins;
        }

        [HttpGet]
        public async Task<IEnumerable<Process>> Get()
        {
            return await _processService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<ProcessViewModel> GetById(int id)
        {
            if (id > 0)
            {
                var process = await _processService.Get(id, p => p.Profiles, p => p.Qualifiers);
                return process.ToViewModel();
            }
            else
            {
                return new ProcessViewModel
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
            // If hierarchy is not defined select default root
            process.HierarchyId = process.HierarchyId == 0 ? (await _hierarchyService.GetRoot(HierarchyType.Process)).Id : process.HierarchyId;
            var result = await _processService.Save(process);
            return result;
        }

        [HttpPut("{id:int}/parent")]
        public async Task<Process> ChangeParent(int id, [FromBody] DomainObjectViewModel parent)
        {
            var result = await _processService.ChangeParent(id, parent.Id);
            return result;
        }

        [HttpGet("hierarchy")]
        public async Task<IEnumerable<HierarchyItemViewModel>> GetHierarchy()
        {
            var processes = (await _processService.GetAll())
                .Select(p => p.ToHierarchyItem()).ToList();
            var folders = (await _hierarchyService.GetTree(HierarchyType.Process, UserInfo.Groups))
                .Select(h => h.ToHierarchyItem()).ToList();

            var tree = folders.Concat(processes).ToTree().ToList();
            // always expand root if just one
            if (tree.Count() == 1)
            {
                tree.First().expanded = true;
            }

            return tree;
        }

        #region profiles
        /// <summary>
        /// Get missing inputs in every profile
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet("{id:int}/inputs")]
        public async Task<IEnumerable<string>> GetMissingInputs(int id)
        {
            var missing = await _processService.GetMissingInputs(id);
            return missing;
        }

        [HttpGet("{id:int}/profiles")]
        public async Task<IEnumerable<ProfileViewModel>> GetProfiles(int id)
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


        [HttpPost("{id:int}/profiles")]
        public async Task<ProfileViewModel> AddProfile(int id, ProfileViewModel model)
        {
            var profile = model.ToEntity();
            profile = await _processService.AddProfile(id, profile);
            return profile.ToViewModel();
        }

        [HttpPut("{id:int}/profiles")]
        public async Task<ProfileViewModel> SaveProfile(int id, ProfileViewModel model)
        {
            var profile = model.ToEntity();
            profile.ProcessId = id;
            var result = await _processService.SaveProfile(profile);
            return result.ToViewModel();
        }

        [HttpDelete("{id:int}/profiles/{profileId:int}")]

        public async Task<bool> DeleteProfile(int id, int profileId)
        {
            var wasDetached = await _processService.DeleteProfile(id, profileId);
            return wasDetached;
        }

        #endregion

        #region qualifiers

        [HttpGet("{id:int}/qualifiers")]
        public async Task<IEnumerable<QualifierViewModel>> GetQualifiers(int id)
        {
            var qualifiers = await _processService.GetQualifiers(id);
            return qualifiers.Select(q => q.ToViewModel()).ToList();
        }

        [HttpPost("{id:int}/qualifiers")]
        public async Task<QualifierViewModel> AddQualifier(int id, QualifierViewModel model)
        {
            var qualifier = model.ToEntity();
            qualifier = await _processService.AddQualifier(id, qualifier);
            return qualifier.ToViewModel();
        }

        [HttpDelete("{id:int}/qualifiers/{qualifierId:int}")]
        public async Task<bool> DeleteQualifier(int id, int qualifierId)
        {
            var wasDetached = await _processService.DeleteQualifier(id, qualifierId);
            return wasDetached;
        }

        [HttpPut("{processId:int}/qualifiers")]
        public async Task<QualifierViewModel> SaveQualifier(int processId, QualifierViewModel model)
        {
            var qualifier = model.ToEntity();
            qualifier.ProcessId = processId;
            var result = await _processService.SaveQualifier(qualifier);
            return result.ToViewModel();
        }

        #endregion
    }
}
