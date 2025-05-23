using Optosense.Edm.Domain.Models;
using System;
using System.Collections;
using System.Collections.Generic;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.ViewModels
{
    public class OrderProcessViewModel
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; } 
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public Guid? ProcessId { get; set; }
        public string? ProcessName { get; set; }
        public ProcessKinds? ProcessKind { get; set; }
        public Guid? ProcessNomenclatureId { get; set; }
        public string? ProcessNomenclatureName { get; set; }
    }
}
