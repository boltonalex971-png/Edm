using System.Collections.Generic;
using System.Linq.Expressions;
using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Controllers;
using Microprojects.Edm.Shared.Utils;
using Microprojects.Edm.Shared.ViewModels;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class ProcessesController : EntriesControllerBase<Process, ProcessViewModel, IProcessService>
{
    private readonly ILogger<ProcessesController> _logger;

    public ProcessesController(ILogger<ProcessesController> logger,
        IProcessService service, IDirectoryService directoryService,
        IDirectoryRootRegistry rootRegistry, IConfiguration configuration) :
        base(service, directoryService, rootRegistry, configuration)
    {
    }

    protected override ProcessViewModel ToViewModel(Process entry) => entry.ToViewModel();
    protected override Process ToEntity(ProcessViewModel model) => model.ToEntity();

    [HttpGet]
    public override async Task<IEnumerable<ProcessViewModel>> GetAllEntries([FromQuery] string? kind = null)
    {
        var predicate = BuildKindPredicate(kind);
        var entries = await Service.GetAll(predicate);
        return entries.Select(e => e.ToViewModel()).ToList();
    }

    [HttpGet("hierarchy")]
    public override async Task<IEnumerable<DirectoryEntryViewModel>> GetEntryHierarchy([FromQuery] string? kind = null)
    {
        var predicate = BuildKindPredicate(kind);
        var rootId = GetEntryRootId(kind)
            ?? throw new EdmException(
                "Edm.Directory.NoTypeRoot",
                new Dictionary<string, object> { ["entryType"] = nameof(Process) },
                $"No type root configured for {nameof(Process)}.");
        var entries = await Service.GetAll(predicate);
        return await DirectoryHelper.BuildEntryHierarchy(
            entries, rootId, DirectoryService, e => e.ToViewModel());
    }

    // Process is split across three kind-specific roots (manufacturing /
    // technology / operation). The kind comes in as a string query param;
    // the LogisticsDirectoryRootRegistry forwards it to
    // WellKnownDirectoryIds.ResolveRoot(string, string) which handles the
    // enum parsing.
    protected override Guid? GetEntryRootId(string? kind) =>
        RootRegistry.ResolveRoot(nameof(Process), kind);

    protected override Guid? GetEntryRootIdFor(Process entity) =>
        RootRegistry.ResolveRoot(nameof(Process), entity.Kind.ToString());

    private static ProcessKinds ParseKindOrDefault(string? kind)
    {
        if (!string.IsNullOrEmpty(kind) && Enum.TryParse<ProcessKinds>(kind, true, out var parsed))
        {
            return parsed;
        }
        return ProcessKinds.Manufacturing;
    }

    private static Expression<Func<Process, bool>> BuildKindPredicate(string? kind)
    {
        var value = ParseKindOrDefault(kind);
        return e => e.Kind == value;
    }

    [HttpGet("kinds")]
    public IEnumerable<string> GetProcessKinds() => Enum.GetNames(typeof(ProcessKinds));

    #region subprocesses

    [HttpGet("{id:guid}/subprocesses")]
    public async Task<IEnumerable<SubProcessViewModel>> GetSubProcesses(Guid id)
    {
        if (id == Guid.Empty)
        {
            return new List<SubProcessViewModel>();
        }

        var subs = await Service.GetSubProcesses(id);
        return subs.Select(s => s.ToViewModel()).ToList();
    }

    [HttpPut("{id:guid}/subprocesses")]
    public async Task<SubProcessViewModel> SaveSubProcess(Guid id, SubProcessViewModel model)
    {
        var sp = model.ToEntity();
        var result = await Service.SaveSubProcess(sp);
        return result.ToViewModel();
    }

    [HttpPost("{id:guid}/subprocesses")]
    public async Task<SubProcessViewModel> AddSubProcess(Guid id, SubProcessViewModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var subProcess = model.ToEntity();
        subProcess = await Service.AddSubProcess(id, subProcess);
        return subProcess.ToViewModel();
    }

    [HttpDelete("{id:guid}/subprocesses/{subProcessId:guid}")]
    public async Task<bool> DeleteSubProcess(Guid id, Guid subProcessId)
    {
        var wasDetached = await Service.DeleteSubProcess(id, subProcessId);
        return wasDetached;
    }

    #endregion

    #region grades

    [HttpGet("{id:guid}/grades")]
    public async Task<IEnumerable<GradeViewModel>> GetGrades(Guid id)
    {
        if (id == Guid.Empty)
        {
            return [];
        }

        var grades = await Service.GetGrades(id);
        return grades.Select(g => g.ToViewModel()).ToList();
    }

    [HttpPost("{id:guid}/grades")]
    public async Task<GradeViewModel> AddGrade(Guid id, [FromBody] GradeViewModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var grade = model.ToEntity();
        var result = await Service.AddGrade(id, grade);
        return result.ToViewModel();
    }

    [HttpPut("{id:guid}/grades")]
    public async Task<GradeViewModel> SaveGrade(Guid id, [FromBody] GradeViewModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var grade = model.ToEntity();
        var result = await Service.SaveGrade(id, grade);
        return result.ToViewModel();
    }

    [HttpDelete("{id:guid}/grades/{gradeId:guid}")]
    public async Task<bool> DeleteGrade(Guid id, Guid gradeId)
    {
        var result = await Service.DeleteGrade(id, gradeId);
        return result;
    }

    #endregion

    #region  specification

    [HttpGet("{id:guid}/specification")]
    public async Task<IEnumerable<SpecificationRowViewModel>> GetSpecification(Guid id)
    {
        var spec = await Service.GetActiveSpecification(id);
        return spec == null ? [] : spec.Rows.Select(r => r.ToViewModel()).ToList();
    }

    [HttpPost("{id:guid}/specification")]
    public async Task<SpecificationRowViewModel> AddSpecificationRow(Guid id, [FromBody] SpecificationRowViewModel model)
    {
        var row = model.ToEntity();
        var result = await Service.AddSpecificationRow(id, row);
        return result.ToViewModel();
    }

    [HttpPut("{id:guid}/specification")]
    public async Task<SpecificationRowViewModel> SaveSpecificationRow(Guid id, SpecificationRowViewModel model)
    {
        var row = model.ToEntity();
        var result = await Service.SaveSpecificationRow(id, row);
        return result.ToViewModel();
    }

    [HttpDelete("{id:guid}/specification/{rowId:guid}")]
    public async Task<bool> DeleteSpecificationRow(Guid id, Guid rowId)
    {
        var result = await Service.DeleteSpecificationRow(id, rowId);
        return result;
    }

    #endregion
}
