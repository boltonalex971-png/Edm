namespace Microprojects.Edm.Ui.Logistics.Models;

public class NomenclatureTareType : DomainObject
{
    public Guid NomenclatureId { get; set; }
    public Nomenclature Nomenclature { get; set; } = null!;
    public Guid TareTypeId { get; set; }
    public TareType TareType { get; set; } = null!;
}
