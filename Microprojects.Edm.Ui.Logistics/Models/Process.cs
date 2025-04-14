namespace Microprojects.Edm.Ui.Logistics.Models;

public enum ProcessKinds
{
    Production,
    Technology,
    Operation
}

public class Process : DirectoryEntry
{
    public ProcessKinds Kind { get; set; }
}