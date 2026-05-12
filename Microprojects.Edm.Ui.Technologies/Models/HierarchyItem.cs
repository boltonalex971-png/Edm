using Microprojects.Edm.Ui.Technologies.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class HierarchyItem
    {
        public string ItemType { get => IsFolder ? "folder" : HierarchyType.ToString().ToLower(); }
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsFolder { get; set; }
        public bool IsActive { get; set; }
        public HierarchyType HierarchyType { get; set; }
        public bool HasChildren { get => Items?.Count() > 0; }
        public IEnumerable<HierarchyItem> Items { get; set; }
    }
}
