using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class NomenclatureService : ServiceBase<Nomenclature>, INomenclatureService
{
    public NomenclatureService()
    {
    }

    public NomenclatureService(LogisticsContext db, IUserService userService) : base(db, userService)
    {
    }
    
    public override async Task<Nomenclature> Get(Guid id)
    {
        var nomenclature = await Set().AsNoTracking()
            .Include(o => o.DefaultTareType)
            .FirstOrDefaultAsync(o => o.Id == id);
        return nomenclature;
    }
    public override async Task<IEnumerable<Nomenclature>> GetAll()
    {
        var query = Set().AsNoTracking();
        var result = await query
            .Include(i => i.DefaultTareType)
            .Include(e => e.Meta)
            .Where(e => e.Meta.Deleted == null)
            .ToListAsync();

        return result;    
    }
}