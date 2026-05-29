namespace Microprojects.Edm.Ui.Logistics.Models;

public class Grade : DomainObject
{
    public Guid ProcessId { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public string? QualifierName { get; set; }
    public string Color { get; set; } = "#7dd3fc";

    // A terminal grade ends the chain for a cell: it is excluded (skipCells) from subsequent Tech steps.
    public bool IsTerminating { get; set; }

    public Process Process { get; set; }
}