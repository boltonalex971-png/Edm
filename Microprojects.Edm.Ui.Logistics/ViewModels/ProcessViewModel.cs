using Optosense.Edm.Domain.Models;
using System;
using System.Collections;
using System.Collections.Generic;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.ViewModels
{
    public class ProcessViewModel : DirectoryEntryViewModel
    {
        public ProcessKinds Kind { get; set; }
        public string? NomenclatureName { get; set; }
        public Guid? NomenclatureId { get; set; }
    }
}
