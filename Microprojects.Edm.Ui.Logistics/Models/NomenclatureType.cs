namespace Microprojects.Edm.Ui.Logistics.Models;

public class NomenclatureType : DirectoryEntry
{
    public Guid TareTypeId { get; set; }
    
    public required TareType TareType { get; set; }
}