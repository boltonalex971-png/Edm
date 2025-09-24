using AutoMapper;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Utils;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Optosense.Edm.Core.AspNet.Controllers;
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class DirectoriesController : AuthControllerBase
{
    private readonly ILogger<DirectoriesController> _logger;
    private readonly IMapper _mapper;
    private readonly IDirectoryService _directoryService;
    private readonly ICache _cache;

    public DirectoriesController(ILogger<DirectoriesController> logger, IMapper mapper, ICache cache,
        IDirectoryService directoryService, IConfiguration configuration) :
        base(configuration)
    {
        _logger = logger;
        _mapper = mapper;
        _directoryService = directoryService;
        _cache = cache;
    }

    //[HttpPost]
    //public JsonResult KeepTreeExpandedState(HierarchyType type, IEnumerable<TreeExpandedState> items)
    //{
    //    _cache.StoreMany(UiCacheHelper.OwnerKey(this), items, () => type);
    //    return Json("Ok");
    //}

    [HttpGet]
    public async Task<IEnumerable<Directory>> Get()
    {
        return await _directoryService.GetAll();
    }

    [HttpGet("{id:guid}")]
    public async Task<DirectoryViewModel> GetById(Guid id)
    {
        if (id != Guid.Empty)
        {
            return _mapper.Map<DirectoryViewModel>(await _directoryService.Get(id));
        }

        return new DirectoryViewModel();
    }

    [HttpPut("{id:guid}/parent")]
    public async Task<Directory> ChangeParent(Guid id, [FromBody] DirectoryEntryViewModel parent)
    {
        var result = await _directoryService.ChangeParent(id, parent.Id);
        return result;
    }

    //public async Task<string> GetHierarchyEditor(Guid id, int? parentId = null, HierarchyType type = HierarchyType.Any)
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

    [HttpGet("{entryType}/tree")]
    public async Task<IEnumerable<DirectoryEntryViewModel>> GetHierarchyTree(string entryType)
    {
        var folders =
            _mapper.Map<IEnumerable<DirectoryEntryViewModel>>(
                    await _directoryService.GetTree(entryType))
                .ToList();
        var tree = folders.ToTree();
        return tree;
    }

    [HttpPost]
    public async Task<DirectoryViewModel> Create([FromBody] DirectoryViewModel model)
    {
        // If parent is not defined select default one
        model.DirectoryId ??= Directory.GeneralRootId;
        var directory = _mapper.Map<Directory>(model);
        directory.Meta = new Meta
        {
            Owner = UserInfo.Name,
            Metatype = nameof(Directory),
            Groups = model.Groups == null ? [] : [model.Groups]
        };
        var saved = await _directoryService.Save(directory);
        return _mapper.Map<DirectoryViewModel>(saved);
    }

    [HttpPut("{id:guid}")]
    public async Task<DirectoryViewModel> Save(Guid id, [FromBody] DirectoryViewModel model)
    {
        var directory = _mapper.Map<Directory>(model);
        directory.Meta = new Meta
        {
            Owner = UserInfo.Name,
            Metatype = nameof(Directory),
            Groups = model.Groups == null ? [] : [model.Groups]
        };
        var saved = await _directoryService.Save(directory);
        return _mapper.Map<DirectoryViewModel>(saved);
    }

    [HttpDelete("{id:guid}")]
    public async Task<DirectoryViewModel> Delete(Guid id)
    {
        var deleted = await _directoryService.Delete(id);
        return _mapper.Map<DirectoryViewModel>(deleted);
    }
}