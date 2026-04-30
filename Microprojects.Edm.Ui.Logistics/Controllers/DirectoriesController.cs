using AutoMapper;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Utils;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Optosense.Edm.Core.AspNet.Controllers;
using Optosense.Edm.Plugins;
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

    [HttpGet("{entryType}/tree")]
    public async Task<IEnumerable<DirectoryEntryViewModel>> GetHierarchyTree(
        string entryType,
        [FromQuery] string? kind = null)
    {
        var rootId = WellKnownDirectoryIds.ResolveRoot(entryType, kind)
            ?? throw new EdmException($"No type root configured for {entryType}.");

        var folders = _mapper
            .Map<IEnumerable<DirectoryEntryViewModel>>(await _directoryService.GetSubtreeFolders(rootId))
            .ToList();
        return folders.ToTree();
    }

    [HttpPost]
    public async Task<DirectoryViewModel> Create([FromBody] DirectoryViewModel model)
    {
        if (model.DirectoryId is null || model.DirectoryId == Directory.GeneralRootId)
        {
            throw new EdmException("New folders must be created inside a type root.");
        }

        var parentRoot = await _directoryService.ResolveTypeRoot(model.DirectoryId.Value);
        if (parentRoot is null)
        {
            throw new EdmException("Parent folder is not under a recognized type root.");
        }

        var directory = _mapper.Map<Directory>(model);
        var groups = (model.Groups ?? [])
            .Where(g => !string.IsNullOrWhiteSpace(g))
            .Select(g => g.Trim())
            .ToArray();
        directory.Meta = new Meta
        {
            Owner = UserInfo.Name,
            Metatype = nameof(Directory),
            Groups = groups
        };
        var saved = await _directoryService.Save(directory);
        return _mapper.Map<DirectoryViewModel>(saved);
    }

    [HttpPut("{id:guid}")]
    public async Task<DirectoryViewModel> Save(Guid id, [FromBody] DirectoryViewModel model)
    {
        if (WellKnownDirectoryIds.IsTypeRoot(id) || id == Directory.GeneralRootId)
        {
            throw new EdmException("Built-in folders cannot be edited.");
        }

        var directory = _mapper.Map<Directory>(model);
        var groups = (model.Groups ?? [])
            .Where(g => !string.IsNullOrWhiteSpace(g))
            .Select(g => g.Trim())
            .ToArray();
        directory.Meta = new Meta
        {
            Owner = UserInfo.Name,
            Metatype = nameof(Directory),
            Groups = groups
        };
        var saved = await _directoryService.Save(directory);
        return _mapper.Map<DirectoryViewModel>(saved);
    }

    [HttpDelete("{id:guid}")]
    public async Task<DirectoryViewModel> Delete(Guid id)
    {
        if (WellKnownDirectoryIds.IsTypeRoot(id) || id == Directory.GeneralRootId)
        {
            throw new EdmException("Built-in folders cannot be deleted.");
        }

        var deleted = await _directoryService.Delete(id);
        return _mapper.Map<DirectoryViewModel>(deleted);
    }
}
