using Microprojects.Edm.Domain;
using System;
using System.Collections;
using System.Collections.Generic;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.ViewModels
{
    public class NomenclatureViewModel : DirectoryEntryViewModel
    {
        public NomenclatureCategories Category { get; set; }

    public bool Countable { get; set; }

        public Guid? DefaultTareTypeId { get; set; }
        public string? DefaultTareTypeName { get; set; }
    }
}
