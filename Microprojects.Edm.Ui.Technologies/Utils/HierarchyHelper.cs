using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Utils
{
    public static class HierarchyHelper
    {
        public static IEnumerable<HierarchyItemViewModel> ToTree(this IEnumerable<HierarchyItemViewModel> items)
        {
            var ids = items.Where(i => i.IsFolder).Select(i => i.Id);
            var upper = items.Where(i => !ids.Contains(i.ParentId));
            foreach (var item in upper)
            {
                yield return item.FillFrom(items);
            }
        }

        //public static IEnumerable<HierarchyItemViewModel> ToTree(this IEnumerable<WorkplaceProcess> workplaceProcesses)
        //{
        //}

        public static IEnumerable<HierarchyItemViewModel> ToDeepTree(this IEnumerable<HierarchyItemViewModel> items, int? rootId = null)
        {
            var children = items.Where(c => c.ParentId == rootId || rootId == null && !items.Any(i => i.Id == c.ParentId));
            foreach (var c in children)
            {
                yield return new HierarchyItemViewModel
                {
                    Id = c.Id,
                    ParentId = c.ParentId,
                    Description = c.Description,
                    HierarchyType = c.HierarchyType,
                    IsActive = c.IsActive,
                    IsFolder = c.IsFolder,
                    Name = c.Name,
                    expanded = true,
                    Items = c.Items ?? items.ToDeepTree(c.Id)
                };
            }
        }

        public static HierarchyItemViewModel FillFrom(this HierarchyItemViewModel item, IEnumerable<HierarchyItemViewModel> items)
        {
            var result = item;
            if (item.IsFolder)
            {
                var childNodes = items
                    .Where(i => i.IsFolder && i.ParentId == item.Id)
                    .Select(i => i.FillFrom(items));
                var childLeaves = items.Where(i => !i.IsFolder && i.ParentId == item.Id);
                if (childNodes.Count() + childLeaves.Count() > 0)
                {
                    //result = _mapper.Map(item, new HierarchyItemViewModel());
                    result.Items = childNodes.Concat(childLeaves);
                }
            }

            return result;
        }

        public static string GetTreeExpansionStatusKey(this Controller controller, HierarchyType type)
        {
            var root = $"UI:{nameof(Hierarchy)}:{type}";
            var id = controller.User.Identity.IsAuthenticated ? controller.User.Identity.Name : controller.HttpContext.Session.Id;
            return $"{root}:{id}:{type}";
        }
    }
}