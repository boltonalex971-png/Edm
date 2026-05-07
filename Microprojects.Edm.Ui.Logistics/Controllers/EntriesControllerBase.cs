using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Utils;
using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Plugins;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class EntriesControllerBase<TEntry, TEntryViewModel, TService> : AuthControllerBase
    where TService : IGenericService<TEntry>
    where TEntry : DirectoryEntry
    where TEntryViewModel : DirectoryEntryViewModel, new()
{
    protected readonly IMapper Mapper;
    protected readonly TService Service;
    protected readonly IDirectoryService DirectoryService;

    public EntriesControllerBase(IMapper mapper, TService service, IDirectoryService directoryService, IConfiguration configuration) :
        base(configuration)
    {
        Mapper = mapper;
        Service = service;
        DirectoryService = directoryService;
    }

    [HttpGet]
    public virtual async Task<IEnumerable<TEntryViewModel>> GetAllEntries([FromQuery] string? kind = null)
    {
        var entries = await Service.GetAll();
        return Mapper.Map<IEnumerable<TEntryViewModel>>(entries);
    }

    [HttpGet("hierarchy")]
    public virtual async Task<IEnumerable<DirectoryEntryViewModel>> GetEntryHierarchy([FromQuery] string? kind = null)
    {
        var rootId = GetEntryRootId(kind)
            ?? throw new EdmException($"No type root configured for {typeof(TEntry).Name}.");
        var entries = await Service.GetAll();
        return await BuildEntryHierarchy(entries, rootId);
    }

    [HttpGet("{id:guid}")]
    public async Task<TEntryViewModel> GetEntryById(Guid id)
    {
        if (id != Guid.Empty)
        {
            var entry = await Service.Get(id);
            var model = Mapper.Map<TEntryViewModel>(entry);
            return model;
        }

        return new TEntryViewModel
        {
            Name = string.Empty,
            Description = string.Empty,
        };
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TEntry>> SaveEntry(
        Guid id,
        [FromBody] TEntryViewModel model,
        [FromQuery] bool force = false)
    {
        var entry = Mapper.Map<TEntry>(model);
        if (id != entry.Id)
        {
            throw new EdmException($"{typeof(TEntry).Name} id is ambiguous");
        }

        await EnsureEntryParent(entry);

        try
        {
            var result = await Service.Save(entry, force);
            return result;
        }
        catch (Services.ForkRequiredException ex)
        {
            return Conflict(new { detail = ex.Message, code = "fork-required" });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<TEntry> DeleteEntry(Guid id)
    {
        var entry = await Service.Delete(id);
        return entry;
    }

    [HttpPost]
    public async Task<TEntry> CreateEntry([FromBody] TEntryViewModel model)
    {
        var entry = Mapper.Map<TEntry>(model);
        await EnsureEntryParent(entry);
        var result = await Service.Save(entry);
        return result;
    }

    [HttpPut("{id:guid}/parent")]
    public async Task<TEntryViewModel> ChangeEntryParent(Guid id, [FromBody] DirectoryViewModel parent)
    {
        var existing = await Service.Get(id)
            ?? throw new EdmException($"{typeof(TEntry).Name} with Id {id} not found.");

        var expectedRoot = GetEntryRootIdFor(existing)
            ?? throw new EdmException($"No type root configured for {typeof(TEntry).Name}.");

        await EnsureParentInTypeRoot(parent.Id, expectedRoot);

        var result = await Service.ChangeParent<TEntry>(id, parent.Id);
        return Mapper.Map<TEntryViewModel>(result);
    }

    /// Resolves the type-root folder id for a hierarchy request. The default
    /// implementation ignores <paramref name="kind"/> — subclasses (e.g.
    /// <c>ProcessesController</c>) override to incorporate it.
    protected virtual Guid? GetEntryRootId(string? kind) =>
        WellKnownDirectoryIds.ResolveRoot(typeof(TEntry));

    /// Resolves the type-root folder id for an existing entity. Subclasses
    /// override when the entity carries a discriminator (e.g. Process.Kind).
    protected virtual Guid? GetEntryRootIdFor(TEntry entity) =>
        WellKnownDirectoryIds.ResolveRoot(typeof(TEntry));

    private async Task EnsureEntryParent(TEntry entity)
    {
        var expectedRoot = GetEntryRootIdFor(entity)
            ?? throw new EdmException($"No type root configured for {typeof(TEntry).Name}.");
        await EnsureParentInTypeRoot(entity.DirectoryId, expectedRoot);
    }

    private async Task EnsureParentInTypeRoot(Guid? parentId, Guid expectedRootId)
    {
        if (parentId is null || parentId == Guid.Empty)
        {
            throw new EdmException($"{typeof(TEntry).Name} must live under its type root.");
        }

        var actualRoot = await DirectoryService.ResolveTypeRoot(parentId.Value);
        if (actualRoot != expectedRootId)
        {
            throw new EdmException($"{typeof(TEntry).Name} cannot be placed outside its type root.");
        }
    }

    protected async Task<IEnumerable<DirectoryEntryViewModel>> BuildEntryHierarchy(
        IEnumerable<TEntry> entries,
        Guid rootId)
    {
        // Map entries to their derived viewmodel so leaf nodes carry their
        // type-specific fields (Newtonsoft serializes by runtime type).
        var entryViewModels = Mapper.Map<IEnumerable<TEntryViewModel>>(entries)
            .Cast<DirectoryEntryViewModel>()
            .ToList();

        var subtreeFolders = Mapper
            .Map<IEnumerable<DirectoryEntryViewModel>>(await DirectoryService.GetSubtreeFolders(rootId))
            .ToList();

        var rootFolder = subtreeFolders.FirstOrDefault(f => f.Id == rootId);
        if (rootFolder is null)
        {
            // Root not visible to user — return empty rather than leaking entries
            // up to the global Root.
            return Array.Empty<DirectoryEntryViewModel>();
        }

        var subtreeFolderIds = subtreeFolders.Select(f => f.Id).ToHashSet();
        var subtreeEntries = entryViewModels
            .Where(e => e.DirectoryId.HasValue && subtreeFolderIds.Contains(e.DirectoryId.Value))
            .ToList();

        var items = subtreeFolders.Concat(subtreeEntries).ToList();
        rootFolder.Items = items.ToDeepTree(rootId).ToArray();
        rootFolder.DirectoryId = null;

        return new[] { rootFolder };
    }
}
