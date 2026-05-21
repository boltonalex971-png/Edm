using System;
using System.Collections.Generic;
using System.Linq;
using Microprojects.Edm.Domain;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Shared.Utils;

public static class DirectoryHelper
{
    // Builds the per-leaf /hierarchy response: the subtree rooted at rootId
    // with folder + leaf children nested into a deep tree. Mirrors what
    // Logistics's EntriesControllerBase.BuildEntryHierarchy returns so the
    // Tech and Logistics frontends consume the same shape via MasterDetail.
    public static async System.Threading.Tasks.Task<IEnumerable<DirectoryEntryViewModel>> BuildEntryHierarchy<TEntry>(
        IEnumerable<TEntry> entries,
        Guid rootId,
        IDirectoryService directoryService,
        Func<TEntry, DirectoryEntryViewModel> toViewModel)
        where TEntry : DirectoryEntry
    {
        var entryViewModels = entries.Select(toViewModel).ToList();

        var subtreeFolders = (await directoryService.GetSubtreeFolders(rootId))
            .Select(d => d.ToEntryViewModel())
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

    public static IEnumerable<DirectoryEntryViewModel> ToTree(this ICollection<DirectoryEntryViewModel> items)
    {
        var ids = items.Where(i => i.IsFolder).Select(i => i.Id).ToHashSet();
        var upper = items.Where(i => i.DirectoryId is null || !ids.Contains(i.DirectoryId!.Value));
        foreach (var item in upper)
        {
            yield return item.FillFrom(items);
        }
    }

    public static IEnumerable<DirectoryEntryViewModel> ToDeepTree(
        this ICollection<DirectoryEntryViewModel> items, Guid? rootId = null)
    {
        var children = items.Where(c =>
            c.DirectoryId == rootId ||
            rootId == null && !items.Any(i => i.Id == c.DirectoryId));

        var result = new List<DirectoryEntryViewModel>();
        foreach (var c in children)
        {
            // Mutate the original node so its runtime type is preserved.
            // Allocating a fresh DirectoryEntryViewModel here would strip
            // derived viewmodels of their type-specific fields when
            // Newtonsoft serializes the result.
            c.Items = items.ToDeepTree(c.Id).ToArray();
            c.Expanded = true;
            result.Add(c);
        }
        return result;
    }

    public static DirectoryEntryViewModel FillFrom(
        this DirectoryEntryViewModel item, ICollection<DirectoryEntryViewModel> items)
    {
        if (!item.IsFolder)
        {
            return item;
        }

        var childNodes = items
            .Where(i => i.IsFolder && i.DirectoryId == item.Id)
            .Select(i => i.FillFrom(items))
            .ToList();
        var childLeaves = items
            .Where(i => !i.IsFolder && i.DirectoryId == item.Id)
            .ToList();
        if (childNodes.Count + childLeaves.Count > 0)
        {
            item.Items = childNodes.Concat(childLeaves).ToArray();
        }
        return item;
    }

    public static string GetTreeExpansionStatusKey(this Controller controller, string entryType)
    {
        var root = $"UI:Directory:{entryType}";
        var id = controller.User.Identity.IsAuthenticated
            ? controller.User.Identity.Name
            : controller.HttpContext.Session.Id;
        return $"{root}:{id}:{entryType}";
    }
}
