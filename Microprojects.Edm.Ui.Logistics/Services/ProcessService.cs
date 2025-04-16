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

    public ProcessService()
    {
    }

    public ProcessService(LogisticsContext db) : base(db)
    {
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
}