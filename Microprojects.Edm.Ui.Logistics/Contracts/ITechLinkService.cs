using System;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface ITechLinkService
{
    // Links a Tech process as an ordered step of a Logistics Technology process.
    // Ensures an Id-shared Operation process (Logistics Process.Id == Tech Process Id),
    // seeds grades from the Tech qualifiers when none exist, and adds the SubProcess link.
    Task LinkTechStep(Guid technologyProcessId, Guid techProcessId, ProcessMode? mode, int order);
}
