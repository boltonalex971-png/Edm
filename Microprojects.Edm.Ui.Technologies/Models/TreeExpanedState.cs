using Microprojects.Edm.Ui.Technologies.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class TreeExpanedState
    {
        public int Id { get; set; }
        public bool Expanded { get; set; }
        public HierarchyType Type { get; set; }
    }
}