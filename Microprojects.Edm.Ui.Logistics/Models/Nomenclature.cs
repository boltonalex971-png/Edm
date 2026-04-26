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
    /// Nomenclature category
    /// </summary>
    public NomenclatureCategories Category { get; set; }

    /// <summary>
    /// If true, quantities are expected to represent whole pieces (but allocation can still
    /// produce fractional remainders when technology ratios are decimal).
    /// </summary>
    public bool Countable { get; set; } = true;
    
    public TareType? DefaultTareType { get; set; }
    public Guid? DefaultTareTypeId { get; set; }

    public ICollection<NomenclatureTareType>? AllowedTareTypes { get; set; }
}