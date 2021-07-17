using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Optosense.Edm.WebUi.Models
{
    public class HierarchyViewModel
    {
        public int Id { get; set; }
        public int? ParentId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public HierarchyType Type { get; set; }
        public bool IsPublic { get; set; } = true;
        public bool IsNode { get => true; }
        public string Owner { get; set; }
        public string Group { get; set; }
        public bool HasChildren { get => false; }
    }

    public class HierarchyItemViewModel
    {
        public string ItemType { get => IsNode ? "folder" : HierarchyType.ToString().ToLower(); }
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsNode { get; set; }
        public HierarchyType HierarchyType { get; set; }
        public bool HasChildren { get => Items?.Count() > 0; }
        public IEnumerable<HierarchyItemViewModel> Items { get; set; }
        public bool expanded { get; set; } // camelCase for compatibility with Kendo TreeView
    }
}