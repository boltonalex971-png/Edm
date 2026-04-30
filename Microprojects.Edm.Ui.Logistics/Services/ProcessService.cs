using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class ProcessService : ServiceBase<Process>, IProcessService
{
    #region injected properties

    //protected IIstpContextFactory ContextFactory { get; set; }
    //private IProfileServic _profileService { get; set; }
    //private IHierarchyService _hierarchyService;

    #endregion
    
    public ISpecificationService SpecificationService { get; set; }

    public ProcessService()
    {
    }

    public ProcessService(LogisticsContext db, IUserService userService, ISpecificationService specificationService) : base(db, userService)
    {
        SpecificationService = specificationService;
    }

    public override async Task<Process> Get(Guid id)
    {
        var result = await Set().AsNoTracking()
            .Include(p => p.Nomenclature)
            .FirstOrDefaultAsync(p => id == p.Id);
        return result;
    }
    
    public async Task<IEnumerable<SubProcess>> GetSubProcesses(Guid id)
    {
        var subs = await Set<SubProcess>().AsNoTracking()
            .Include(s => s.LinkedProcess)
            .Where(s => s.ProcessId == id)
            .ToListAsync();
        return subs;
    }

    public async Task<SubProcess> AddSubProcess(Guid id, SubProcess process)
    {
        process.ProcessId = id;
        process.SetId();
        var sub = Set<SubProcess>().Add(process);
        await Db.SaveChangesAsync();
        return sub.Entity;
    }

    public async Task<SubProcess> SaveSubProcess(SubProcess sp)
    {
        var sub = Set<SubProcess>().Attach(sp);
        sub.State = EntityState.Modified;
        await Db.SaveChangesAsync();
        return sub.Entity;
    }

    public async Task<bool> DeleteSubProcess(Guid id, Guid subProcessId)
    {
        var sup = Set<SubProcess>().Attach(new SubProcess {Id = subProcessId});
        sup.State = EntityState.Deleted;
        await Db.SaveChangesAsync();
        return true;
    }
    
    public async Task<Specification?> GetActiveSpecification(Guid processId)
    {
        var spec = await Db.Specifications.AsNoTracking()
            .Include(s => s.Rows)
            .ThenInclude(r => r.Nomenclature)
            .FirstOrDefaultAsync(s => s.ProcessId == processId && s.Active); 
                   //?? throw new EdmException("No active specification found");
        return spec;
    }

    public async Task<SpecificationNomenclature> AddSpecificationRow(Guid processId, SpecificationNomenclature row)
    {
        var spec = await Db.Specifications
            .Include(s => s.Rows)
            .FirstOrDefaultAsync(s => s.ProcessId == processId && s.Active);
        // Add active specification if not exists
        if (spec == null)
        {
            var process = await Get(processId);
            spec = await SpecificationService.Save(new Specification
            {
                Active = true,
                ProcessId = processId,
                Name = process.Name,
                Description = $"Specification for process {process.Name}",
                // TODO the owner must be obtained from UserService
                Meta = new Meta {Metatype = nameof(Specification), Owner = UserService.GetUserName()}
            });
        }
        
        row.Nomenclature = null;
        row.SetId();
        spec.Rows.Add(row);
        await Db.SaveChangesAsync();
        return row;
    }

    public async Task<SpecificationNomenclature> SaveSpecificationRow(Guid processId, SpecificationNomenclature row)
    {
        row.Nomenclature = null;
        row.Specification = null;
        var sub = Set<SpecificationNomenclature>().Attach(row);
        sub.State = EntityState.Modified;
        await Db.SaveChangesAsync();
        return sub.Entity;
    }

    public async Task<bool> DeleteSpecificationRow(Guid id, Guid rowId)
    {
        var sup = Set<SpecificationNomenclature>().Attach(new SpecificationNomenclature {Id = rowId});
        sup.State = EntityState.Deleted;
        await Db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<Grade>> GetGrades(Guid processId)
    {
        var result = await Set<Grade>()
            .AsNoTracking()
            .Where(g => g.ProcessId == processId)
            .ToListAsync();
        return result;
    }

    public async Task<Grade> AddGrade(Guid processId, Grade grade)
    {
        ArgumentNullException.ThrowIfNull(grade);
        grade.ProcessId = processId;
        grade.Description ??= string.Empty;
        grade.QualifierName ??= string.Empty;
        grade.Process = null!;
        grade.SetId();

        var entry = Set<Grade>().Add(grade);
        await Db.SaveChangesAsync();
        return entry.Entity;
    }

    public async Task<Grade> SaveGrade(Guid processId, Grade grade)
    {
        ArgumentNullException.ThrowIfNull(grade);
        grade.ProcessId = processId;
        grade.Description ??= string.Empty;
        grade.QualifierName ??= string.Empty;
        grade.Process = null!;

        var entry = Set<Grade>().Attach(grade);
        entry.State = EntityState.Modified;
        await Db.SaveChangesAsync();
        return entry.Entity;
    }

    public async Task<bool> DeleteGrade(Guid processId, Guid gradeId)
    {
        var entry = Set<Grade>().Attach(new Grade {Id = gradeId});
        entry.State = EntityState.Deleted;
        await Db.SaveChangesAsync();
        return true;
    }
}