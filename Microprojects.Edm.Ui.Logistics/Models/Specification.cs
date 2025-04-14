using System.Collections.ObjectModel;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics.Models;

public class Specification : DomainObject
{
    public ICollection<SpecificationNomenclature> Row { get; set; }
}