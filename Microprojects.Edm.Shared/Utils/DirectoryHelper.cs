using System;
using System.Collections.Generic;
using System.Linq;
using Microprojects.Edm.Shared.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Shared.Utils;

public static class DirectoryHelper
{
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
