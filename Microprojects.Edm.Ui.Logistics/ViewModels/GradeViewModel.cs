namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class GradeViewModel
{
    public Guid Id { get; set; }
    public Guid? ProcessId { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public string? QualifierName { get; set; }
    public string Color { get; set; }
    public bool IsTerminating { get; set; }
}

