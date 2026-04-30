using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Optosense.Edm.Core.AspNet.Controllers;
using Optosense.Edm.Plugins;
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class ProcessesController : EntriesControllerBase<Process, ProcessViewModel, IProcessService>
{
    private readonly ILogger<ProcessesController> _logger;

    public ProcessesController(ILogger<ProcessesController> logger, IMapper mapper, 
        IProcessService service, IDirectoryService directoryService, IConfiguration configuration) :
        base(mapper, service, directoryService, configuration)
    {
    }

    [HttpGet]
    public override async Task<IEnumerable<ProcessViewModel>> GetAllEntries([FromQuery] string? kind = null)
    {
        var predicate = BuildKindPredicate(kind);
        var entries = await Service.GetAll(predicate);
        return Mapper.Map<IEnumerable<ProcessViewModel>>(entries);
    }

    [HttpGet("hierarchy")]
    public override async Task<IEnumerable<DirectoryEntryViewModel>> GetEntryHierarchy([FromQuery] string? kind = null)
    {
        var predicate = BuildKindPredicate(kind);
        var rootId = GetEntryRootId(kind)
            ?? throw new EdmException($"No type root configured for {nameof(Process)}.");
        var entries = await Service.GetAll(predicate);
        return await BuildEntryHierarchy(entries, rootId);
    }

    protected override Guid? GetEntryRootId(string? kind) =>
        WellKnownDirectoryIds.ResolveRoot(typeof(Process), ParseKindOrDefault(kind));

    protected override Guid? GetEntryRootIdFor(Process entity) =>
        WellKnownDirectoryIds.ResolveRoot(typeof(Process), entity.Kind);

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
        var model = Mapper.Map<IEnumerable<SubProcessViewModel>>(subs);
        return model;
    }

    [HttpPut("{id:guid}/subprocesses")]
    public async Task<SubProcessViewModel> SaveSubProcess(Guid id, SubProcessViewModel model)
    {
        var sp = Mapper.Map<SubProcess>(model);
        var result = await Service.SaveSubProcess(sp);
        return Mapper.Map<SubProcessViewModel>(result);
    }

    [HttpPost("{id:guid}/subprocesses")]
    public async Task<SubProcessViewModel> AddSubProcess(Guid id, SubProcessViewModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var subProcess = Mapper.Map<SubProcess>(model);
        subProcess = await Service.AddSubProcess(id, subProcess);
        return Mapper.Map<SubProcessViewModel>(subProcess);
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
        return Mapper.Map<IEnumerable<GradeViewModel>>(grades);
    }

    [HttpPost("{id:guid}/grades")]
    public async Task<GradeViewModel> AddGrade(Guid id, [FromBody] GradeViewModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var grade = Mapper.Map<Grade>(model);
        var result = await Service.AddGrade(id, grade);
        return Mapper.Map<GradeViewModel>(result);
    }

    [HttpPut("{id:guid}/grades")]
    public async Task<GradeViewModel> SaveGrade(Guid id, [FromBody] GradeViewModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var grade = Mapper.Map<Grade>(model);
        var result = await Service.SaveGrade(id, grade);
        return Mapper.Map<GradeViewModel>(result);
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
        return spec == null ? [] : Mapper.Map<IEnumerable<SpecificationRowViewModel>>(spec?.Rows);
    }

    [HttpPost("{id:guid}/specification")]
    public async Task<SpecificationRowViewModel> AddSpecificationRow(Guid id, [FromBody] SpecificationRowViewModel model)
    {
        var row = Mapper.Map<SpecificationNomenclature>(model);
        var result = await Service.AddSpecificationRow(id, row);
        return Mapper.Map<SpecificationRowViewModel>(result);
    }

    [HttpPut("{id:guid}/specification")]
    public async Task<SpecificationRowViewModel> SaveSpecificationRow(Guid id, SpecificationRowViewModel model)
    {
        var row = Mapper.Map<SpecificationNomenclature>(model);
        var result = await Service.SaveSpecificationRow(id, row);
        return Mapper.Map<SpecificationRowViewModel>(result);
    }

    [HttpDelete("{id:guid}/specification/{rowId:guid}")]
    public async Task<bool> DeleteSpecificationRow(Guid id, Guid rowId)
    {
        var result = await Service.DeleteSpecificationRow(id, rowId);
        return result;
    }

    #endregion
}