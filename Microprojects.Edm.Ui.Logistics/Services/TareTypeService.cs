using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microsoft.EntityFrameworkCore;
using Microprojects.Edm.Plugins;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class TareTypeService : ServiceBase<TareType>, ITareTypeService
{
    public TareTypeService()
    {
    }

    public TareTypeService(LogisticsContext db, IUserService userService) : base(db, userService)
    {
    }

    public override async Task<TareType> Get(Guid id)
    {
        return await Set().AsNoTracking()
            .Include(t => t.Meta)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public override async Task<TareType> Save(TareType entity)
    {
        Normalize(entity);
        return await base.Save(entity);
    }

    public override async Task<TareType> Save(TareType entity, bool force)
    {
        Normalize(entity);

        if (entity.Id == Guid.Empty)
        {
            return await base.Save(entity);
        }

        var persisted = await Set().AsNoTracking()
            .Include(t => t.Meta)
            .FirstOrDefaultAsync(t => t.Id == entity.Id);
        if (persisted is null)
        {
            return await base.Save(entity);
        }

        if (persisted.Meta.Completed != null)
        {
            throw new EdmException(
                "This tare type is outdated and cannot be edited. Open the current version instead.");
        }

        if (IsTrivialChange(persisted, entity))
        {
            return await base.Save(entity);
        }

        if (!await HasReferences(persisted.Id))
        {
            return await base.Save(entity);
        }

        if (!force)
        {
            throw new ForkRequiredException(
                "This tare type is referenced by existing tares, nomenclatures, or allowed-tare links. " +
                "Saving will create a new version and mark the current one as outdated.");
        }

        var oldMeta = await Set<Meta>().FindAsync(persisted.Id)
                      ?? throw new EdmException("Cannot find Meta for the existing tare type.");
        var oldId = oldMeta.Id;

        ForkEntity(entity, oldMeta);
        var newId = entity.Id;

        // Copy NomenclatureTareType junction rows to the new version.
        var oldLinks = await Db.NomenclatureTareTypes.AsNoTracking()
            .Where(x => x.TareTypeId == oldId)
            .ToListAsync();
        foreach (var link in oldLinks)
        {
            Db.NomenclatureTareTypes.Add(new NomenclatureTareType
            {
                Id = DomainObject.NewGuid(),
                NomenclatureId = link.NomenclatureId,
                TareTypeId = newId,
            });
        }

        await Db.SaveChangesAsync();
        return entity;
    }

    private static void Normalize(TareType entity)
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
    }

    private static bool IsTrivialChange(TareType persisted, TareType proposed)
    {
        // Trivial = only Name/Description/DirectoryId differ. Shape fields
        // (Units, Countable, sizes, Capacity) drive the auto-fork behavior.
        return persisted.Units == proposed.Units
            && persisted.Countable == proposed.Countable
            && persisted.SizeX == proposed.SizeX
            && persisted.SizeY == proposed.SizeY
            && persisted.SizeZ == proposed.SizeZ
            && Math.Abs(persisted.Capacity - proposed.Capacity) < 1e-9;
    }

    private async Task<bool> HasReferences(Guid tareTypeId)
    {
        if (await Db.Tares.AnyAsync(t => t.TareTypeId == tareTypeId))
        {
            return true;
        }

        if (await Db.Nomenclatures.AnyAsync(n => n.DefaultTareTypeId == tareTypeId))
        {
            return true;
        }

        if (await Db.NomenclatureTareTypes.AnyAsync(x => x.TareTypeId == tareTypeId))
        {
            return true;
        }

        return false;
    }

    public async Task<IEnumerable<NomenclatureTareType>> GetAllowedNomenclatures(Guid tareTypeId)
    {
        return await Db.NomenclatureTareTypes.AsNoTracking()
            .Include(x => x.TareType)
            .Include(x => x.Nomenclature).ThenInclude(n => n.Meta)
            .Where(x => x.TareTypeId == tareTypeId
                && x.Nomenclature.Meta.Deleted == null
                && x.Nomenclature.Meta.Completed == null)
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
