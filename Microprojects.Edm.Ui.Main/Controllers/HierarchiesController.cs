using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm.Cache;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Plugins;
using Microprojects.Edm.Ui.Main.Models;
using Microprojects.Edm.Ui.Main.Utils;

namespace Microprojects.Edm.Ui.Main.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HierarchiesController : AuthControllerBase
    {
        private readonly ILogger<HostsController> _logger;
        private readonly IMapper _mapper;
        private readonly IHierarchyService _hierarchyService;
        private readonly ICache _cache;

        public HierarchiesController(ILogger<HostsController> logger, IMapper mapper, ICache cache, IHierarchyService hierarchyService)
        {
            _logger = logger;
            _mapper = mapper;
            _hierarchyService = hierarchyService;
            _cache = cache;
        }

        //[HttpPost]
        //public JsonResult KeepTreeExpandedState(HierarchyType type, IEnumerable<TreeExpanedState> items)
        //{
        //    _cache.StoreMany(UiCacheHelper.OwnerKey(this), items, () => type);
        //    return Json("Ok");
        //}

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
        public async Task<Hierarchy> ChangeParent(int id, [FromBody] HierarchyItemViewModel parent)
        {
            var result = await _hierarchyService.ChangeParent(id, parent.Id);
            return result;
        }

        //public async Task<string> GetHierarchyEditor(int id, int? parentId = null, HierarchyType type = HierarchyType.Any)
        //{
        //    var parent = parentId.HasValue ?
        //        await _hierarchyService.Get(parentId.Value) :
        //        await _hierarchyService.GetRoot(type);
        //    var folder = (await _hierarchyService.Get(id)) ?? new Hierarchy
        //    {
        //        ParentId = parent.Id,
        //        Type = parent.Type,
        //        IsActive = true,
        //        IsPublic = true,
        //        Owner = "user 1" // TODO attach real user
        //    };
        //    var model = Mapper.Map<HierarchyViewModel>(folder);
        //    return RenderViewPart("~/Views/Hierarchy/HierarchyEditor.cshtml", model);
        //}

        [HttpGet("{type}/tree")]
        public async Task<IEnumerable<HierarchyItemViewModel>> GetHierarchyTree(HierarchyType type)
        {
            var folders = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(await _hierarchyService.GetTree(type, UserInfo));
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
            return _mapper.Map<HierarchyItemViewModel>(saved);
        }

        [HttpPut("{id:int}")]
        public async Task<HierarchyItemViewModel> Save(int id, [FromBody] Hierarchy model)
        {
            var saved = await _hierarchyService.Save(model);
            return _mapper.Map<HierarchyItemViewModel>(saved);
        }

        [HttpDelete("{id:int}")]
        public async Task<HierarchyItemViewModel> Delete(int id)
        {
            var deleted = await _hierarchyService.Delete(id);
            return _mapper.Map<HierarchyItemViewModel>(deleted);
        }
    }
}
