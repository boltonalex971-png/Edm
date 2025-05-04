using Optosense.Edm.Domain.Models;
using System;
using System.Collections;
using System.Collections.Generic;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.ViewModels
{
    public class SpecificationRowViewModel 
    {
        public Guid Id { get; set; }
        public Guid SpecificationId { get; set; }
        public Guid NomenclatureId { get; set; }
        public double Quantity { get; set; }
        public string? NomenclatureName { get; set; }
        public string? NomenclatureDescription { get; set; }
        public string? NomenclatureCategory { get; set; }
    }
}
