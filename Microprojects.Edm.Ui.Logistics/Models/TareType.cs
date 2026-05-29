using System.ComponentModel.DataAnnotations.Schema;

namespace Microprojects.Edm.Ui.Logistics.Models;

public enum TareRole
{
    Container,
    Fixture
}

public class TareType : DirectoryEntry
{
    public string Units { get; set; } = string.Empty;
    public bool Countable { get; set; } = true;
    public int? SizeX { get; set; }
    public int? SizeY { get; set; }
    public int? SizeZ { get; set; }
    public double Capacity { get; set; } = 1;

    // Container = ordinary tare; Fixture = usable as a processing-tool fixture in techno-process steps.
    public TareRole Role { get; set; } = TareRole.Container;

    // Cell layout (named cells, geometry, optional schema asset). Universal: any tare type may carry it.
    public string? LayoutJson { get; set; }

    [NotMapped]
    public int Dimensions => (SizeX > 0 ? 1 : 0) + (SizeY > 0 ? 1 : 0) + (SizeZ > 0 ? 1 : 0);
}
