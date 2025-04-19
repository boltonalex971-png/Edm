namespace Microprojects.Edm.Ui.Logistics.Models;

public enum NomenclatureCategories
{
    Product = 0,
    Materials = 1,
    Part = 2,
    Semifinished = 3
}

public class Nomenclature : DirectoryEntry
{
    //public Guid? TareTypeId { get; set; }
    /// <summary>
    /// Nomenclature category
    /// </summary>
    public NomenclatureCategories Category { get; set; }
    //public TareType? TareType { get; set; }
}