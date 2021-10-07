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
using Microprojects.Edm.Ui.Main.Models;
using Microprojects.Edm.Ui.Main.Models;
using Microprojects.Edm.Ui.Main.Utils;

namespace Microprojects.Edm.Ui.Main.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProcessesController : AuthControllerBase
    {
        private readonly ILogger<ProcessesController> _logger;
        private readonly IMapper _mapper;
        private readonly IProcessService _processService;
        private readonly IHierarchyService _hierarchyService;
        private readonly IPluginContainer _plugins;

        public ProcessesController(ILogger<ProcessesController> logger, IMapper mapper, IProcessService processService, IHierarchyService hierarchyService, IPluginContainer plugins)
        {
            _logger = logger;
            _mapper = mapper;
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
            // If hierarchy is not defined select default root
            process.HierarchyId = process.HierarchyId == 0 ? (await _hierarchyService.GetRoot(HierarchyType.Process)).Id : process.HierarchyId;
            var result = await _processService.Save(process);
            return result;
        }

        [HttpPut("{id:int}/parent")]
        public async Task<Process> ChangeParent(int id, [FromBody] HierarchyItemViewModel parent)
        {
            var result = await _processService.ChangeParent(id, parent.Id);
            return result;
        }

        [HttpGet("hierarchy")]
        public async Task<IEnumerable<HierarchyItemViewModel>> GetHierarchy()
        {
            var processes = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(await _processService.GetAll());
            var folders = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(await _hierarchyService.GetTree(HierarchyType.Process, UserInfo));
            //var expanded = _cache.RestoreMany<TreeExpanedState>(UiCacheHelper.OwnerKey(this), () => HierarchyType.Host);
            //foreach (var folder in folders)
            //{
            //    folder.expanded = expanded?.Any(e => e.Id == folder.Id) ?? false;
            //}

            var tree = folders.Concat(processes).ToTree().ToList();
            // always expand root if just one
            if (tree.Count() == 1)
            {
                tree.First().expanded = true;
            }

            return tree;
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
            var profile = _mapper.Map<Optosense.Edm.Domain.Models.Profile>(model);
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
