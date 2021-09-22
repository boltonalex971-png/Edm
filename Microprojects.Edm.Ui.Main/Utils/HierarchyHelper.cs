using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.WebUi.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Optosense.Edm.WebUi.Utils
{
    public static class HierarchyHelper
    {
        public static IEnumerable<HierarchyItemViewModel> ToTree(this IEnumerable<HierarchyItemViewModel> items)
        {
            var ids = items.Where(i => i.IsNode).Select(i => i.Id);
            var upper = items.Where(i => !ids.Contains(i.ParentId));
            foreach (var item in upper)
            {
                yield return item.FillFrom(items);
            }
        }

        public static HierarchyItemViewModel FillFrom(this HierarchyItemViewModel item, IEnumerable<HierarchyItemViewModel> items)
        {
            var result = item;
            if (item.IsNode) {
                var childNodes = items
                    .Where(i => i.IsNode && i.ParentId == item.Id)
                    .Select(i => i.FillFrom(items));
                var childLeaves = items.Where(i => !i.IsNode && i.ParentId == item.Id); 
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
            var id = controller.User.Identity.IsAuthenticated? controller.User.Identity.Name : controller.HttpContext.Session.Id;
            return $"{root}:{id}:{type}";
        }
    }
}