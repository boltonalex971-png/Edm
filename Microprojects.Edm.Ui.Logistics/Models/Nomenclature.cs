namespace Microprojects.Edm.Ui.Logistics.Models;

public enum NomenclatureCategory
{
    Materials = 0,
    Semifinished = 1,
    Part = 2,
    Product = 3
}

public class Nomenclature : DirectoryEntry
{
    /// <summary>
    /// Nomenclature category
    /// </summary>
    public NomenclatureCategory Category { get; set; }
}