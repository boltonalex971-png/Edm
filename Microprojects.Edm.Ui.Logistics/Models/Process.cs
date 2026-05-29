namespace Microprojects.Edm.Ui.Logistics.Models;

public enum ProcessKinds
{
    Manufacturing,
    Technology,
    Operation
}

// How a Tech-linked operation step distributes its work across fixture cells.
public enum ProcessMode
{
    PerCell,
    SingleCell,
    Global
}

public class Process : DirectoryEntry
{
    public Guid? NomenclatureId { get; set; }
    public Nomenclature? Nomenclature { get; set; }
    public ProcessKinds Kind { get; set; }

    // Set on a Kind=Operation process that mirrors a Tech process (shared Id). Null otherwise.
    public ProcessMode? Mode { get; set; }

    // Set on a Kind=Technology process: the fixture TareType (Role=Fixture) its chain runs on.
    public Guid? FixtureTareTypeId { get; set; }
    public TareType? FixtureTareType { get; set; }

    public ICollection<SubProcess>? SubProcesses { get; set; }
    public ICollection<Specification>? Specifications { get; set; }
    public ICollection<Grade>? Grades { get; set; }
}