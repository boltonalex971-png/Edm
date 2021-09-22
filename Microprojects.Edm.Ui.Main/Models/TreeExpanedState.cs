using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Optosense.Edm.WebUi.Models
{
    public class TreeExpanedState
    {
        public int Id { get; set; }
        public bool Expanded { get; set; }
        public HierarchyType Type { get; set; }
    }
}