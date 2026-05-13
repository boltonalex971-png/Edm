using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Utils;

namespace Microprojects.Edm.Ui.Technologies.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
    public class HierarchiesController : AuthControllerBase
    {
        private readonly ILogger<HostsController> _logger;
        private readonly IHierarchyService _hierarchyService;
        private readonly ICache _cache;

        public HierarchiesController(ILogger<HostsController> logger, ICache cache, IHierarchyService hierarchyService, IConfiguration configuration) :
            base(configuration)
        {
            _logger = logger;
            _hierarchyService = hierarchyService;
            _cache = cache;
        }

        [HttpGet]
        public async Task<IEnumerable<Hierarchy>> Get()
        {
            return await _hierarchyService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<Hierarchy> GetById(int id)
        {
            if (id > 0)
            {
                return await _hierarchyService.Get(id);
            }
            else
            {
                return new Hierarchy
                {
                    Name = string.Empty,
                    Description = string.Empty,
                    Group = "group 1",
                    Owner = "owner 1",
                    IsActive = true,
                    IsPublic = true,
                };
            }
        }

        [HttpPut("{id:int}/parent")]
        public async Task<Hierarchy> ChangeParent(int id, [FromBody] DomainObjectViewModel parent)
        {
            var result = await _hierarchyService.ChangeParent(id, parent.Id);
            return result;
        }

        [HttpGet("{type}/tree")]
        public async Task<IEnumerable<HierarchyItemViewModel>> GetHierarchyTree(HierarchyType type)
        {
            var folders = (await _hierarchyService.GetTree(type, UserInfo.Groups))
                .Select(h => h.ToHierarchyItem()).ToList();
            var tree = folders.ToTree();
            return tree;
        }

        [HttpPost]
        public async Task<HierarchyItemViewModel> Create([FromBody] Hierarchy model)
        {
            // If parent is not defined select default one
            model.ParentId = model.ParentId == 0 ? (await _hierarchyService.GetRoot(model.Type)).Id : model.ParentId;
            model.Owner = User.Identity.Name;
            var saved = await _hierarchyService.Save(model);
            return saved.ToHierarchyItem();
        }

        [HttpPut("{id:int}")]
        public async Task<HierarchyItemViewModel> Save(int id, [FromBody] Hierarchy model)
        {
            var saved = await _hierarchyService.Save(model);
            return saved.ToHierarchyItem();
        }

        [HttpDelete("{id:int}")]
        public async Task<HierarchyItemViewModel> Delete(int id)
        {
            var deleted = await _hierarchyService.Delete(id);
            return deleted.ToHierarchyItem();
        }
    }
}
