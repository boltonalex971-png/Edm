using System;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;

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
            .Include(o => o.Meta)
            .FirstOrDefaultAsync(o => o.Id == id);
        return nomenclature;
    }

    public override async Task<Nomenclature> Save(Nomenclature entity, bool force)
    {
        if (entity.Id == Guid.Empty)
        {
            return await base.Save(entity);
        }

        var persisted = await Set().AsNoTracking()
            .Include(n => n.Meta)
            .FirstOrDefaultAsync(n => n.Id == entity.Id);
        if (persisted is null)
        {
            return await base.Save(entity);
        }

        if (persisted.Meta.Completed != null)
        {
            throw new EdmException(
                "Logistics.Nomenclature.Outdated",
                "This nomenclature is outdated and cannot be edited. Open the current version instead.");
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
                "This nomenclature is referenced by existing items, allowed-tare links, specifications, or processes. " +
                "Saving will create a new version and mark the current one as outdated.");
        }

        var oldMeta = await Set<Meta>().FindAsync(persisted.Id)
                      ?? throw new EdmException(
                          "Logistics.Nomenclature.MetaNotFound",
                          "Cannot find Meta for the existing nomenclature.");
        var oldId = oldMeta.Id;

        ForkEntity(entity, oldMeta);
        var newId = entity.Id;

        // Copy NomenclatureTareType junction rows to the new version.
        var oldLinks = await Db.NomenclatureTareTypes.AsNoTracking()
            .Where(x => x.NomenclatureId == oldId)
            .ToListAsync();
        foreach (var link in oldLinks)
        {
            Db.NomenclatureTareTypes.Add(new NomenclatureTareType
            {
                Id = DomainObject.NewGuid(),
                NomenclatureId = newId,
                TareTypeId = link.TareTypeId,
            });
        }

        await Db.SaveChangesAsync();
        return entity;
    }

    private static bool IsTrivialChange(Nomenclature persisted, Nomenclature proposed)
    {
        // Trivial = only Name/Description/DirectoryId differ. Category and
        // Countable affect quantity semantics across existing items, so
        // changing them must fork. DefaultTareTypeId is intentionally ignored
        // because NomenclatureViewModel.ToEntity() does not copy it; the
        // default tare is set via the AllowedTareTypes sub-route.
        return persisted.Category == proposed.Category
            && persisted.Countable == proposed.Countable;
    }

    private async Task<bool> HasReferences(Guid nomenclatureId)
    {
        if (await Db.Items.AnyAsync(i => i.NomenclatureId == nomenclatureId))
        {
            return true;
        }

        if (await Db.NomenclatureTareTypes.AnyAsync(x => x.NomenclatureId == nomenclatureId))
        {
            return true;
        }

        if (await Db.SpecificationNomenclatures.AnyAsync(x => x.NomenclatureId == nomenclatureId))
        {
            return true;
        }

        if (await Db.Processes.AnyAsync(p => p.NomenclatureId == nomenclatureId))
        {
            return true;
        }

        return false;
    }

    public override async Task<IEnumerable<Nomenclature>> GetAll(Expression<Func<Nomenclature, bool>>? predicate = null)
    {
        var query = Set().AsNoTracking()
            .Include(i => i.DefaultTareType)
            .Include(e => e.Meta)
            .Where(e => e.Meta.Deleted == null && e.Meta.Completed == null);

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<NomenclatureTareType>> GetAllowedTareTypes(Guid nomenclatureId)
    {
        return await Db.NomenclatureTareTypes.AsNoTracking()
            .Include(x => x.TareType).ThenInclude(t => t.Meta)
            .Include(x => x.Nomenclature)
            .Where(x => x.NomenclatureId == nomenclatureId
                && x.TareType.Meta.Deleted == null
                && x.TareType.Meta.Completed == null)
            .ToListAsync();
    }

    public async Task<NomenclatureTareType> AddAllowedTareType(Guid nomenclatureId, Guid tareTypeId, bool makeDefault)
    {
        var nomenclature = await Db.Nomenclatures.FirstOrDefaultAsync(n => n.Id == nomenclatureId)
            ?? throw new EdmException(
                "Logistics.Nomenclature.NotFound",
                "Nomenclature not found.");
        var exists = await Db.NomenclatureTareTypes
            .AnyAsync(x => x.NomenclatureId == nomenclatureId && x.TareTypeId == tareTypeId);
        if (exists)
        {
            throw new EdmException(
                "Logistics.Nomenclature.TareTypeAlreadyAllowed",
                "This tare type is already in the allowed list.");
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
            ?? throw new EdmException(
                "Logistics.Nomenclature.AllowedTareNotFound",
                "Allowed-tare row not found.");
        var nomenclature = await Db.Nomenclatures.FirstOrDefaultAsync(n => n.Id == nomenclatureId)
            ?? throw new EdmException(
                "Logistics.Nomenclature.NotFound",
                "Nomenclature not found.");

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
