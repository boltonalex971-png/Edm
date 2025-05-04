using System.Collections.ObjectModel;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics.Models;

public class Specification : DirectoryEntry
{
    public bool Active { get; set; }
    public Guid ProcessId { get; set; } 
    public Process Process { get; set; }
    public ICollection<SpecificationNomenclature> Rows { get; set; } = [];
}