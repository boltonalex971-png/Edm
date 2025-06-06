namespace Microprojects.Edm.Ui.Logistics.Models;

public class TareType : DirectoryEntry
{
    public string Units { get; set; } = string.Empty;
    public bool Countable { get; set; } = true;
    public int Dimensions { get; set; } = 1;
    public double Capacity { get; set; } = 1;
}