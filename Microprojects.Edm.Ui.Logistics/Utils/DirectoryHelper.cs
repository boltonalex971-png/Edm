using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Directory = Microprojects.Edm.Domain.Directory;

namespace Microprojects.Edm.Ui.Logistics.Utils;

public static class DirectoryHelper
{
    public static IEnumerable<DirectoryEntryViewModel> ToTree(this ICollection<DirectoryEntryViewModel> items)
    {
        var ids = items
            .Where(i => i.IsFolder)
            .Select(i => i.Id);
        var upper = items.Where(i => i.DirectoryId is null || !ids.Contains(i.DirectoryId!.Value));
        foreach (var item in upper)
        {
            yield return item.FillFrom(items);
        }
    }
        
    public static IEnumerable<DirectoryEntryViewModel> ToDeepTree(this ICollection<DirectoryEntryViewModel> items, Guid? rootId = null)
    {
        var children = items.Where(c => c.DirectoryId == rootId || rootId == null && !items.Any(i => i.Id == c.DirectoryId));

        var result = new List<DirectoryEntryViewModel>();

        foreach (var c in children)
        {
            // Mutate the original node so its runtime type is preserved.
            // Allocating a fresh `new DirectoryEntryViewModel { ... }` here
            // would strip derived viewmodels (NomenclatureViewModel,
            // TareTypeViewModel, …) of their type-specific fields when
            // Newtonsoft serializes the result.
            c.Items = items.ToDeepTree(c.Id).ToArray();
            c.Expanded = true;
            result.Add(c);
        }

        return result;
    }

    public static DirectoryEntryViewModel FillFrom(this DirectoryEntryViewModel item, ICollection<DirectoryEntryViewModel> items)
    {
        var result = item;
        if (item.IsFolder) {
            var childNodes = items
                .Where(i => i.IsFolder && i.DirectoryId == item.Id)
                .Select(i => i.FillFrom(items))
                .ToList();
            var childLeaves = items
                .Where(i => !i.IsFolder && i.DirectoryId == item.Id)
                .ToList(); 
            if (childNodes.Count() + childLeaves.Count() > 0)
            {
                //result = _mapper.Map(item, new DirectoryEntryViewModel());
                result.Items = childNodes.Concat(childLeaves).ToArray();
            }
        }

        return result;
    }

    public static string GetTreeExpansionStatusKey(this Controller controller, string entryType)
    {
        var root = $"UI:{nameof(Directory)}:{entryType}";
        var id = controller.User.Identity.IsAuthenticated? controller.User.Identity.Name : controller.HttpContext.Session.Id;
        return $"{root}:{id}:{entryType}";
    }
}