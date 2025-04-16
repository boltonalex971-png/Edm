namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class SubProcessViewModel
{
    public Guid Id { get; set; }
    public Guid? ProcessId { get; set; }
    public Guid LinkedProcessId { get; set; }
    public int Order { get; set; }
    public string? LinkedProcessName { get; set; }
    public string? LinkedProcessKind { get; set; }
    public string? LinkedProcessDescription { get; set; }
}