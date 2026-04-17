using System.ComponentModel.DataAnnotations.Schema;

namespace Microprojects.Edm.Ui.Logistics.Models;

public class TareType : DirectoryEntry
{
    public string Units { get; set; } = string.Empty;
    public bool Countable { get; set; } = true;
    public int? SizeX { get; set; }
    public int? SizeY { get; set; }
    public int? SizeZ { get; set; }
    public double Capacity { get; set; } = 1;

    [NotMapped]
    public int Dimensions => (SizeX > 0 ? 1 : 0) + (SizeY > 0 ? 1 : 0) + (SizeZ > 0 ? 1 : 0);
}
