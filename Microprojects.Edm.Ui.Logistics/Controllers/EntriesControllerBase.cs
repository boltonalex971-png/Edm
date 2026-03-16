using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Optosense.Edm.Core.AspNet.Controllers;
using Optosense.Edm.Plugins;

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
        var entries = await Service.GetAll();
        return await BuildEntryHierarchy(entries);
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
    public async Task<TEntry> SaveEntry(Guid id, [FromBody] TEntryViewModel model)
    {
        var entry = Mapper.Map<TEntry>(model);
        if (id != entry.Id)
        {
            throw new Exception($"{typeof(TEntry).Name} id is ambiguous");
        }

        var result = await Service.Save(entry);
        return result;
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
        var result = await Service.Save(entry);
        return result;
    }

    [HttpPut("{id:guid}/parent")]
    public async Task<TEntryViewModel> ChangeEntryParent(Guid id, [FromBody] DirectoryViewModel parent)
    {
        var result = await Service.ChangeParent<TEntry>(id, parent.Id);
        return Mapper.Map<TEntryViewModel>(result);
    }

    protected async Task<IEnumerable<DirectoryEntryViewModel>> BuildEntryHierarchy(IEnumerable<TEntry> entries)
    {
        // 1) find all entries of target type (already provided as `entries`)
        var entryViewModels = Mapper.Map<IEnumerable<DirectoryEntryViewModel>>(entries).ToList();
        if (entryViewModels.Count == 0)
        {
            return Array.Empty<DirectoryEntryViewModel>();
        }

        var allFolders = Mapper.Map<IEnumerable<DirectoryEntryViewModel>>(
            await DirectoryService.GetTree(typeof(TEntry).Name)).ToList();
        var foldersById = allFolders.ToDictionary(f => f.Id);

        // 2) find the first common root of all found entries (lowest common ancestor of their directories)
        Guid? fallbackRootId = allFolders.FirstOrDefault(f => f.DirectoryId is null)?.Id;
        DirectoryEntryViewModel? rootFolder = null;

        var rootFolderModel = await DirectoryService.GetRoot(typeof(TEntry).Name);
        if (rootFolderModel is not null)
        {
            rootFolder = Mapper.Map<DirectoryEntryViewModel>(rootFolderModel);
            fallbackRootId = rootFolder.Id;
        }

        var commonRootId = FindCommonRootId(entryViewModels, foldersById, fallbackRootId);

        // 3) retrieve the root with all its subdirectories
        HashSet<Guid> subtreeFolderIds;
        List<DirectoryEntryViewModel> subtreeFolders;

        if (commonRootId.HasValue && foldersById.ContainsKey(commonRootId.Value))
        {
            subtreeFolderIds = CollectSubtreeFolderIds(commonRootId.Value, allFolders);
            subtreeFolders = allFolders.Where(f => subtreeFolderIds.Contains(f.Id)).ToList();
        }
        else
        {
            // no folders/root available; return entries as a flat "tree"
            var entryOnly = entryViewModels.ToList();
            return entryOnly.ToTree();
        }

        // 4) merge the directory tree and entries (exclude other entry types by construction)
        var subtreeEntries = entryViewModels
            .Where(e => e.DirectoryId is null || subtreeFolderIds.Contains(e.DirectoryId.Value))
            .ToList();

        var items = subtreeFolders.Concat(subtreeEntries).ToList();

        // ensure the requested common root is returned (even if it has a parent outside the subtree)
        var commonRoot = items.First(i => i.IsFolder && i.Id == commonRootId.Value);
        commonRoot.Items = items.ToDeepTree(commonRootId.Value).ToArray();
        commonRoot.DirectoryId = null;

        return new[] { commonRoot };
    }

    private static Guid? FindCommonRootId(
        IReadOnlyCollection<DirectoryEntryViewModel> entries,
        IDictionary<Guid, DirectoryEntryViewModel> foldersById,
        Guid? fallbackRootId)
    {
        HashSet<Guid>? common = null;

        foreach (var entry in entries)
        {
            var ancestors = GetAncestorFolderIds(entry.DirectoryId, foldersById, fallbackRootId);

            if (common is null)
            {
                common = ancestors;
            }
            else
            {
                common.IntersectWith(ancestors);
            }

            if (common.Count == 0)
            {
                break;
            }
        }

        if (common is null || common.Count == 0)
        {
            return fallbackRootId;
        }

        return common
            .OrderByDescending(id => GetFolderDepth(id, foldersById))
            .First();
    }

    private static HashSet<Guid> GetAncestorFolderIds(
        Guid? startDirectoryId,
        IDictionary<Guid, DirectoryEntryViewModel> foldersById,
        Guid? fallbackRootId)
    {
        var result = new HashSet<Guid>();
        if (fallbackRootId.HasValue)
        {
            result.Add(fallbackRootId.Value);
        }

        var current = startDirectoryId;
        while (current.HasValue && foldersById.TryGetValue(current.Value, out var folder))
        {
            if (!result.Add(folder.Id))
            {
                break;
            }

            current = folder.DirectoryId;
        }

        return result;
    }

    private static int GetFolderDepth(Guid folderId, IDictionary<Guid, DirectoryEntryViewModel> foldersById)
    {
        var depth = 0;
        var current = folderId;
        var guard = 0;

        while (guard++ < 10_000 &&
               foldersById.TryGetValue(current, out var folder) &&
               folder.DirectoryId.HasValue &&
               foldersById.ContainsKey(folder.DirectoryId.Value))
        {
            depth++;
            current = folder.DirectoryId.Value;
        }

        return depth;
    }

    private static HashSet<Guid> CollectSubtreeFolderIds(Guid rootId, IReadOnlyCollection<DirectoryEntryViewModel> allFolders)
    {
        var childrenLookup = allFolders
            .Where(f => f.DirectoryId.HasValue)
            .GroupBy(f => f.DirectoryId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Id).ToList());

        var result = new HashSet<Guid>();
        var queue = new Queue<Guid>();

        result.Add(rootId);
        queue.Enqueue(rootId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (!childrenLookup.TryGetValue(current, out var children))
            {
                continue;
            }

            foreach (var childId in children)
            {
                if (result.Add(childId))
                {
                    queue.Enqueue(childId);
                }
            }
        }

        return result;
    }
}