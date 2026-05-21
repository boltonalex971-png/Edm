using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Domain;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microprojects.Edm.Shared.Utils;
using Microprojects.Edm.Shared.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Microprojects.Edm.Shared.Controllers;

// Plugin-agnostic CRUD + hierarchy controller base for DirectoryEntry leaf
// types. Concrete controllers carry their own `[Route]` attribute (Logistics
// uses `api/logistics/[controller]`, Tech `api/technologies/[controller]`)
// and supply `ToViewModel` / `ToEntity` mappings. Type-root lookup goes
// through the injected IDirectoryRootRegistry so each plugin's well-known
// roots stay plugin-local.
public abstract class EntriesControllerBase<TEntry, TEntryViewModel, TService> : AuthControllerBase
    where TService : IGenericService<TEntry>
    where TEntry : DirectoryEntry
    where TEntryViewModel : DirectoryEntryViewModel, new()
{
    protected readonly TService Service;
    protected readonly IDirectoryService DirectoryService;
    protected readonly IDirectoryRootRegistry RootRegistry;

    protected EntriesControllerBase(
        TService service,
        IDirectoryService directoryService,
        IDirectoryRootRegistry rootRegistry,
        IConfiguration configuration) : base(configuration)
    {
        Service = service;
        DirectoryService = directoryService;
        RootRegistry = rootRegistry;
    }

    protected abstract TEntryViewModel ToViewModel(TEntry entry);
    protected abstract TEntry ToEntity(TEntryViewModel model);

    [HttpGet]
    public virtual async Task<IEnumerable<TEntryViewModel>> GetAllEntries([FromQuery] string? kind = null)
    {
        var entries = await Service.GetAll();
        return entries.Select(ToViewModel).ToList();
    }

    [HttpGet("hierarchy")]
    public virtual async Task<IEnumerable<DirectoryEntryViewModel>> GetEntryHierarchy([FromQuery] string? kind = null)
    {
        var rootId = GetEntryRootId(kind)
            ?? throw new EdmException(
                "Edm.Directory.NoTypeRoot",
                new Dictionary<string, object> { ["entryType"] = typeof(TEntry).Name },
                $"No type root configured for {typeof(TEntry).Name}.");
        var entries = await Service.GetAll();
        return await DirectoryHelper.BuildEntryHierarchy(
            entries, rootId, DirectoryService, e => ToViewModel(e));
    }

    [HttpGet("{id:guid}")]
    public virtual async Task<TEntryViewModel> GetEntryById(Guid id)
    {
        if (id != Guid.Empty)
        {
            var entry = await Service.Get(id);
            return ToViewModel(entry);
        }

        return new TEntryViewModel
        {
            Name = string.Empty,
            Description = string.Empty,
        };
    }

    [HttpPut("{id:guid}")]
    public virtual async Task<ActionResult<TEntry>> SaveEntry(
        Guid id,
        [FromBody] TEntryViewModel model,
        [FromQuery] bool force = false)
    {
        var entry = ToEntity(model);
        if (id != entry.Id)
        {
            throw new EdmException(
                "Edm.Entry.IdAmbiguous",
                new Dictionary<string, object> { ["type"] = typeof(TEntry).Name },
                $"{typeof(TEntry).Name} id is ambiguous");
        }

        await EnsureEntryParent(entry);

        try
        {
            var result = await Service.Save(entry, force);
            return result;
        }
        catch (ForkRequiredException ex)
        {
            return Conflict(new { detail = ex.Message, code = "fork-required" });
        }
    }

    [HttpDelete("{id:guid}")]
    public virtual async Task<TEntry> DeleteEntry(Guid id)
    {
        var entry = await Service.Delete(id);
        return entry;
    }

    [HttpPost]
    public virtual async Task<TEntry> CreateEntry([FromBody] TEntryViewModel model)
    {
        var entry = ToEntity(model);
        await EnsureEntryParent(entry);
        var result = await Service.Save(entry);
        return result;
    }

    [HttpPut("{id:guid}/parent")]
    public virtual async Task<TEntryViewModel> ChangeEntryParent(Guid id, [FromBody] DomainObjectViewModel parent)
    {
        var existing = await Service.Get(id)
            ?? throw new EdmException(
                "Edm.Entry.NotFound",
                new Dictionary<string, object> { ["type"] = typeof(TEntry).Name, ["id"] = id },
                $"{typeof(TEntry).Name} with Id {id} not found.");

        var expectedRoot = GetEntryRootIdFor(existing)
            ?? throw new EdmException(
                "Edm.Directory.NoTypeRoot",
                new Dictionary<string, object> { ["entryType"] = typeof(TEntry).Name },
                $"No type root configured for {typeof(TEntry).Name}.");

        await EnsureParentInTypeRoot(parent.Id, expectedRoot);

        var result = await Service.ChangeParent<TEntry>(id, parent.Id);
        return ToViewModel(result);
    }

    // Resolves the type-root folder id for a hierarchy request. Default uses
    // the plugin's IDirectoryRootRegistry; subclasses override when the
    // request payload alone isn't enough (e.g. ProcessesController already
    // forwards kind through the registry — no override needed).
    protected virtual Guid? GetEntryRootId(string? kind) =>
        RootRegistry.ResolveRoot(typeof(TEntry).Name, kind);

    // Resolves the type-root folder id for an existing entity. Subclasses
    // override when the entity carries a discriminator the request doesn't
    // (e.g. Process.Kind for the manufacturing/technology/operation split).
    protected virtual Guid? GetEntryRootIdFor(TEntry entity) =>
        RootRegistry.ResolveRoot(typeof(TEntry).Name);

    private async Task EnsureEntryParent(TEntry entity)
    {
        var expectedRoot = GetEntryRootIdFor(entity)
            ?? throw new EdmException(
                "Edm.Directory.NoTypeRoot",
                new Dictionary<string, object> { ["entryType"] = typeof(TEntry).Name },
                $"No type root configured for {typeof(TEntry).Name}.");
        await EnsureParentInTypeRoot(entity.DirectoryId, expectedRoot);
    }

    private async Task EnsureParentInTypeRoot(Guid? parentId, Guid expectedRootId)
    {
        if (parentId is null || parentId == Guid.Empty)
        {
            throw new EdmException(
                "Edm.Entry.MustLiveInTypeRoot",
                new Dictionary<string, object> { ["type"] = typeof(TEntry).Name },
                $"{typeof(TEntry).Name} must live under its type root.");
        }

        var actualRoot = await DirectoryService.ResolveTypeRoot(parentId.Value);
        if (actualRoot != expectedRootId)
        {
            throw new EdmException(
                "Edm.Entry.CannotPlaceOutsideTypeRoot",
                new Dictionary<string, object> { ["type"] = typeof(TEntry).Name },
                $"{typeof(TEntry).Name} cannot be placed outside its type root.");
        }
    }
}
