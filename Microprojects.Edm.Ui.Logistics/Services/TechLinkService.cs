using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Contracts.ProcessDefinition;
using Microprojects.Edm.Domain;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics.Services;

// Consumer-side linking: turns a Tech process into an ordered step of a
// Logistics Technology process. Tech data is read through the
// ProcessDefinition contract (bridged into the Technologies plugin scope).
public class TechLinkService : ITechLinkService
{
    private readonly LogisticsContext _db;
    private readonly IProcessDefinitionService _techProcesses;
    private readonly IUserService _users;

    public TechLinkService(
        LogisticsContext db,
        IProcessDefinitionService techProcesses,
        IUserService users)
    {
        _db = db;
        _techProcesses = techProcesses;
        _users = users;
    }

    public async Task LinkTechStep(Guid technologyProcessId, Guid techProcessId, ProcessMode? mode, int order)
    {
        var parent = await _db.Processes.FirstOrDefaultAsync(p => p.Id == technologyProcessId)
            ?? throw new EdmException(
                "Logistics.TechLink.ParentNotFound",
                "Parent technology process not found.");
        if (parent.Kind != ProcessKinds.Technology)
        {
            throw new EdmException(
                "Logistics.TechLink.ParentNotTechnology",
                "Tech steps can only be added to a Technology process.");
        }

        var summary = (await _techProcesses.ListProcessesAsync())
            .FirstOrDefault(p => p.Id == techProcessId)
            ?? throw new EdmException(
                "Logistics.TechLink.TechProcessNotFound",
                "The selected Tech process was not found.");

        if (mode == ProcessMode.PerCell && !summary.IsCellAware)
        {
            throw new EdmException(
                "Logistics.TechLink.PerCellRequiresCellAware",
                "Per-cell mode requires a cell-aware operation plugin.");
        }

        // Id-shared Operation process: Logistics Process.Id == Tech Process Id.
        // Created with a forced Id (and Meta sharing the PK) — bypasses
        // ServiceBase.Save, which would mint a fresh Id for a new row.
        var operation = await _db.Processes.FirstOrDefaultAsync(p => p.Id == techProcessId);
        if (operation is null)
        {
            operation = new Process
            {
                Id = techProcessId,
                Kind = ProcessKinds.Operation,
                Name = summary.Name,
                Description = summary.Description,
                Mode = mode,
                DirectoryId = null,
                Meta = new Meta
                {
                    Id = techProcessId,
                    Owner = _users?.GetUserName() ?? string.Empty,
                    Metatype = nameof(Process),
                },
            };
            _db.Processes.Add(operation);
            await _db.SaveChangesAsync();
        }
        else
        {
            operation.Mode = mode;
            await _db.SaveChangesAsync();
        }

        // Seed grades from the Tech qualifiers onto the parent TECHNOLOGY
        // process (where the Grades tab lives). Operations accumulate grades
        // there; skip qualifier names already present so re-links and multiple
        // steps don't create duplicates. Afterwards the admin maintains the list.
        var qualifiers = await _techProcesses.ListQualifiersAsync(techProcessId);
        if (qualifiers.Count > 0)
        {
            var existingNames = await _db.Grades
                .Where(g => g.ProcessId == technologyProcessId && g.QualifierName != null)
                .Select(g => g.QualifierName!)
                .ToListAsync();
            var seen = new HashSet<string>(existingNames, StringComparer.OrdinalIgnoreCase);

            var added = false;
            foreach (var qualifier in qualifiers)
            {
                if (!seen.Add(qualifier.Name))
                {
                    continue;
                }

                _db.Grades.Add(new Grade
                {
                    Id = DomainObject.NewGuid(),
                    ProcessId = technologyProcessId,
                    Name = qualifier.Name,
                    QualifierName = qualifier.Name,
                    Description = qualifier.Description ?? string.Empty,
                    IsTerminating = false,
                    Color = "#7dd3fc",
                    Process = null!,
                });
                added = true;
            }

            if (added)
            {
                await _db.SaveChangesAsync();
            }
        }

        // Add the SubProcess link (idempotent).
        var alreadyLinked = await _db.SubProcesses
            .AnyAsync(s => s.ProcessId == technologyProcessId && s.LinkedProcessId == techProcessId);
        if (!alreadyLinked)
        {
            _db.SubProcesses.Add(new SubProcess
            {
                Id = DomainObject.NewGuid(),
                ProcessId = technologyProcessId,
                LinkedProcessId = techProcessId,
                Order = order,
            });
            await _db.SaveChangesAsync();
        }
    }
}
