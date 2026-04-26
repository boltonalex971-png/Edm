using System;
using System.Linq.Expressions;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Plugins;

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

    public override async Task<IEnumerable<Nomenclature>> GetAll(Expression<Func<Nomenclature, bool>>? predicate = null)
    {
        var query = Set().AsNoTracking()
            .Include(i => i.DefaultTareType)
            .Include(e => e.Meta)
            .Where(e => e.Meta.Deleted == null);

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<NomenclatureTareType>> GetAllowedTareTypes(Guid nomenclatureId)
    {
        return await Db.NomenclatureTareTypes.AsNoTracking()
            .Include(x => x.TareType)
            .Include(x => x.Nomenclature)
            .Where(x => x.NomenclatureId == nomenclatureId)
            .ToListAsync();
    }

    public async Task<NomenclatureTareType> AddAllowedTareType(Guid nomenclatureId, Guid tareTypeId, bool makeDefault)
    {
        var nomenclature = await Db.Nomenclatures.FirstOrDefaultAsync(n => n.Id == nomenclatureId)
            ?? throw new EdmException("Nomenclature not found.");
        var exists = await Db.NomenclatureTareTypes
            .AnyAsync(x => x.NomenclatureId == nomenclatureId && x.TareTypeId == tareTypeId);
        if (exists)
        {
            throw new EdmException("This tare type is already in the allowed list.");
        }

        var row = new NomenclatureTareType
        {
            NomenclatureId = nomenclatureId,
            TareTypeId = tareTypeId,
        }.SetId();

        Db.NomenclatureTareTypes.Add(row);
        if (makeDefault)
        {
            nomenclature.DefaultTareTypeId = tareTypeId;
        }
        await Db.SaveChangesAsync();

        return await ReloadWithIncludes(row.Id);
    }

    public async Task<NomenclatureTareType> SetAllowedTareTypeDefault(Guid nomenclatureId, Guid linkId, bool makeDefault)
    {
        var row = await Db.NomenclatureTareTypes.FirstOrDefaultAsync(x => x.Id == linkId && x.NomenclatureId == nomenclatureId)
            ?? throw new EdmException("Allowed-tare row not found.");
        var nomenclature = await Db.Nomenclatures.FirstOrDefaultAsync(n => n.Id == nomenclatureId)
            ?? throw new EdmException("Nomenclature not found.");

        if (makeDefault)
        {
            nomenclature.DefaultTareTypeId = row.TareTypeId;
        }
        else if (nomenclature.DefaultTareTypeId == row.TareTypeId)
        {
            nomenclature.DefaultTareTypeId = null;
        }
        await Db.SaveChangesAsync();

        return await ReloadWithIncludes(row.Id);
    }

    public async Task<bool> RemoveAllowedTareType(Guid nomenclatureId, Guid linkId)
    {
        var row = await Db.NomenclatureTareTypes.FirstOrDefaultAsync(x => x.Id == linkId && x.NomenclatureId == nomenclatureId);
        if (row == null)
        {
            return false;
        }

        var nomenclature = await Db.Nomenclatures.FirstOrDefaultAsync(n => n.Id == nomenclatureId);
        Db.NomenclatureTareTypes.Remove(row);
        if (nomenclature != null && nomenclature.DefaultTareTypeId == row.TareTypeId)
        {
            nomenclature.DefaultTareTypeId = null;
        }
        await Db.SaveChangesAsync();
        return true;
    }

    private Task<NomenclatureTareType> ReloadWithIncludes(Guid linkId)
    {
        return Db.NomenclatureTareTypes.AsNoTracking()
            .Include(x => x.TareType)
            .Include(x => x.Nomenclature)
            .FirstAsync(x => x.Id == linkId);
    }
}
