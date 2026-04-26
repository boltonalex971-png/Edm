using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Plugins;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class TareTypeService : ServiceBase<TareType>, ITareTypeService
{
    public TareTypeService()
    {
    }

    public TareTypeService(LogisticsContext db, IUserService userService) : base(db, userService)
    {
    }

    public override async Task<TareType> Save(TareType entity)
    {
        var eps = 1e-9;

        if (entity.Countable && entity.SizeX > 0)
        {
            entity.Capacity = (entity.SizeX ?? 1) * (entity.SizeY ?? 1) * (entity.SizeZ ?? 1);
        }
        else if (entity.Countable)
        {
            // Countable bulk tares store piece-count in Capacity -> must be integer.
            var rounded = Math.Round(entity.Capacity);
            if (entity.Capacity < 1 || Math.Abs(entity.Capacity - rounded) > eps)
            {
                throw new EdmException("Capacity must be a positive integer for countable bulk tare types.");
            }

            entity.Capacity = rounded;
        }

        return await base.Save(entity);
    }

    public async Task<IEnumerable<NomenclatureTareType>> GetAllowedNomenclatures(Guid tareTypeId)
    {
        return await Db.NomenclatureTareTypes.AsNoTracking()
            .Include(x => x.TareType)
            .Include(x => x.Nomenclature)
            .Where(x => x.TareTypeId == tareTypeId)
            .ToListAsync();
    }

    public async Task<NomenclatureTareType> AddAllowedNomenclature(Guid tareTypeId, Guid nomenclatureId)
    {
        var exists = await Db.NomenclatureTareTypes
            .AnyAsync(x => x.NomenclatureId == nomenclatureId && x.TareTypeId == tareTypeId);
        if (exists)
        {
            throw new EdmException("This nomenclature is already in the allowed list.");
        }

        var row = new NomenclatureTareType
        {
            NomenclatureId = nomenclatureId,
            TareTypeId = tareTypeId,
        }.SetId();

        Db.NomenclatureTareTypes.Add(row);
        await Db.SaveChangesAsync();

        return await Db.NomenclatureTareTypes.AsNoTracking()
            .Include(x => x.TareType)
            .Include(x => x.Nomenclature)
            .FirstAsync(x => x.Id == row.Id);
    }

    public async Task<bool> RemoveAllowedNomenclature(Guid tareTypeId, Guid linkId)
    {
        var row = await Db.NomenclatureTareTypes.FirstOrDefaultAsync(x => x.Id == linkId && x.TareTypeId == tareTypeId);
        if (row == null)
        {
            return false;
        }

        var nomenclature = await Db.Nomenclatures.FirstOrDefaultAsync(n => n.Id == row.NomenclatureId);
        Db.NomenclatureTareTypes.Remove(row);
        if (nomenclature != null && nomenclature.DefaultTareTypeId == tareTypeId)
        {
            nomenclature.DefaultTareTypeId = null;
        }
        await Db.SaveChangesAsync();
        return true;
    }
}
