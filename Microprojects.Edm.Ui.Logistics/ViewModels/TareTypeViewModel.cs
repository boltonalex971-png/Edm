using Optosense.Edm.Domain.Models;
using System;
using System.Collections;
using System.Collections.Generic;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.ViewModels
{
    public class TareTypeViewModel : DirectoryEntryViewModel
    {
        public string? Units { get; set; }
        public bool Countable { get; set; }
        public int? SizeX { get; set; }
        public int? SizeY { get; set; }
        public int? SizeZ { get; set; }
        public int Dimensions { get; set; }
        public double Capacity { get; set; } 
    }
}
