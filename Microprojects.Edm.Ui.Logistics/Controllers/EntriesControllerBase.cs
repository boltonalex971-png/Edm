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
        var entryViewModels = Mapper.Map<IEnumerable<DirectoryEntryViewModel>>(entries);
        var folders = Mapper.Map<IEnumerable<DirectoryEntryViewModel>>(
            await DirectoryService.GetTree(typeof(TEntry).Name));

        var items = folders.Concat(entryViewModels).ToList();
        var tree = items.ToTree().ToList();

        var roots = PruneAndCompress(tree).ToList();

        var result = new List<DirectoryEntryViewModel>();
        foreach (var root in roots)
        {
            var children = items.ToDeepTree(root.Id).ToArray();
            root.Items = children;
            result.Add(root);
        }

        return result;
    }

    private static IEnumerable<DirectoryEntryViewModel> PruneAndCompress(ICollection<DirectoryEntryViewModel> roots)
    {
        var result = new List<DirectoryEntryViewModel>();

        foreach (var root in roots)
        {
            var pruned = PruneNode(root, out var hasEntries);
            if (!hasEntries || pruned is null)
            {
                continue;
            }

            var compressed = CompressRoot(pruned);
            result.Add(compressed);
        }

        return result;
    }

    private static DirectoryEntryViewModel? PruneNode(DirectoryEntryViewModel node, out bool hasEntries)
    {
        var isEntry = !node.IsFolder;
        hasEntries = isEntry;

        if (node.Items is null || node.Items.Length == 0)
        {
            return hasEntries ? node : null;
        }

        var newChildren = new List<DirectoryEntryViewModel>();
        var childHasEntries = false;

        foreach (var child in node.Items)
        {
            var prunedChild = PruneNode(child, out var childHas);
            if (prunedChild is not null)
            {
                newChildren.Add(prunedChild);
            }

            if (childHas)
            {
                childHasEntries = true;
            }
        }

        hasEntries = hasEntries || childHasEntries;

        if (!hasEntries && node.IsFolder)
        {
            return null;
        }

        node.Items = newChildren.ToArray();
        return node;
    }

    private static DirectoryEntryViewModel CompressRoot(DirectoryEntryViewModel root)
    {
        var current = root;

        while (current.IsFolder &&
               current.Items is not null &&
               current.Items.Length == 1 &&
               current.Items[0].IsFolder)
        {
            current = current.Items[0];
        }

        return current;
    }
}