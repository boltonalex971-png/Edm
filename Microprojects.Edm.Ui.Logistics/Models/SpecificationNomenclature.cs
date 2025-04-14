namespace Microprojects.Edm.Ui.Logistics.Models;

public class SpecificationNomenclature : DomainObject
{
    public Guid SpecificationId { get; set; }
    public Guid NomenclatureId { get; set; }
    
    public int Quantity { get; set; }
    
    public Specification Specification { get; set; }
    public Nomenclature Nomenclature { get; set; }
}