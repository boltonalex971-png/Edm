using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Domain;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Utils;
using Microprojects.Edm.Shared.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Microprojects.Edm.Shared.Controllers;

// Plugin-agnostic Directory CRUD + tree endpoints. Per-plugin concrete
// controllers inherit this and slap on [Route("api/<plugin>/[controller]")].
//
// Sealed pieces of the contract that DON'T vary per plugin:
//   - DirectoryEntryViewModel / DirectoryViewModel shape (Groups for
//     security, IsPublic derived, Items for tree, Expanded for UI state).
//   - Tree endpoint returns folders only — leaves come through per-type
//     plugin controllers. No legacy entity-kind discriminator.
//   - WellKnownDirectoryIds surfaces through IDirectoryRootRegistry so
//     the plugin's roots can resolve route tokens to Guids.
[ApiController]
public abstract class DirectoriesController : AuthControllerBase
{
    protected readonly IDirectoryService DirectoryService;
    protected readonly IDirectoryRootRegistry Roots;
    protected readonly ICache Cache;

    protected DirectoriesController(ICache cache, IDirectoryService directoryService,
        IDirectoryRootRegistry roots, IConfiguration configuration) : base(configuration)
    {
        DirectoryService = directoryService;
        Roots = roots;
        Cache = cache;
    }

    [HttpGet]
    public virtual async Task<IEnumerable<Directory>> Get()
    {
        return await DirectoryService.GetAll();
    }

    [HttpGet("{id:guid}")]
    public virtual async Task<DirectoryViewModel> GetById(Guid id)
    {
        if (id == Guid.Empty)
        {
            return new DirectoryViewModel();
        }

        var folder = await DirectoryService.Get(id);
        return folder?.ToViewModel() ?? new DirectoryViewModel();
    }

    [HttpPut("{id:guid}/parent")]
    public virtual async Task<Directory> ChangeParent(Guid id, [FromBody] DomainObjectViewModel parent)
    {
        return await DirectoryService.ChangeParent(id, parent.Id);
    }

    [HttpGet("{entryType}/tree")]
    public virtual async Task<IEnumerable<DirectoryEntryViewModel>> GetHierarchyTree(
        string entryType,
        [FromQuery] string? kind = null)
    {
        var rootId = Roots.ResolveRoot(entryType, kind)
            ?? throw new EdmException(
                "Edm.Directory.NoTypeRoot",
                new Dictionary<string, object> { ["entryType"] = entryType },
                $"No type root configured for {entryType}.");

        var folders = (await DirectoryService.GetSubtreeFolders(rootId))
            .Select(d => d.ToEntryViewModel())
            .ToList();
        return folders.ToTree();
    }

    [HttpPost]
    public virtual async Task<DirectoryViewModel> Create([FromBody] DirectoryViewModel model)
    {
        if (model.DirectoryId is null || model.DirectoryId == Directory.GeneralRootId)
        {
            throw new EdmException(
                "Edm.Directory.MustCreateInTypeRoot",
                "New folders must be created inside a type root.");
        }

        var parentRoot = await DirectoryService.ResolveTypeRoot(model.DirectoryId.Value);
        if (parentRoot is null)
        {
            throw new EdmException(
                "Edm.Directory.ParentNotUnderTypeRoot",
                "Parent folder is not under a recognized type root.");
        }

        var directory = model.ToEntity();
        var groups = (model.Groups ?? [])
            .Where(g => !string.IsNullOrWhiteSpace(g))
            .Select(g => g.Trim())
            .ToArray();
        directory.Meta = new Meta
        {
            Owner = UserInfo.Name,
            Metatype = nameof(Directory),
            Groups = groups,
        };
        var saved = await DirectoryService.Save(directory);
        return saved.ToViewModel();
    }

    [HttpPut("{id:guid}")]
    public virtual async Task<DirectoryViewModel> Save(Guid id, [FromBody] DirectoryViewModel model)
    {
        if (Roots.IsTypeRoot(id) || id == Directory.GeneralRootId)
        {
            throw new EdmException(
                "Edm.Directory.BuiltInNotEditable",
                "Built-in folders cannot be edited.");
        }

        var directory = model.ToEntity();
        var groups = (model.Groups ?? [])
            .Where(g => !string.IsNullOrWhiteSpace(g))
            .Select(g => g.Trim())
            .ToArray();
        directory.Meta = new Meta
        {
            Owner = UserInfo.Name,
            Metatype = nameof(Directory),
            Groups = groups,
        };
        var saved = await DirectoryService.Save(directory);
        return saved.ToViewModel();
    }

    [HttpDelete("{id:guid}")]
    public virtual async Task<DirectoryViewModel> Delete(Guid id)
    {
        if (Roots.IsTypeRoot(id) || id == Directory.GeneralRootId)
        {
            throw new EdmException(
                "Edm.Directory.BuiltInNotDeletable",
                "Built-in folders cannot be deleted.");
        }

        var deleted = await DirectoryService.Delete(id);
        return deleted.ToViewModel();
    }
}

