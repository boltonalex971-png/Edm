using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class ItemService : ServiceBase<Item>, IItemService
{
    private readonly ITareService _tareService;

    public ItemService()
    {
    }

    public ItemService(LogisticsContext db, ITareService tareService, IUserService userService) : base(db, userService)
    {
        _tareService = tareService;
    }

    public override async Task<Item> Get(Guid id)
    {
        var result = await Set().AsNoTracking()
            .Include(i => i.Nomenclature)
            .FirstOrDefaultAsync(i => id == i.Id);
        return result;
    }

    public override async Task<IEnumerable<Item>> GetAll()
    {
        var query = Set().AsNoTracking();
        var result = await query
            .Include(i => i.Tare.TareType)
            .Include(i => i.Nomenclature)
            .Include(e => e.Meta)
            .Where(e => e.Meta.Deleted == null)
            .ToListAsync();

        return result;
    }

    public override async Task<Item> Save(Item item)
    {
        if (item.Tare is null && (item.TareId == null || item.TareId == Guid.Empty))
        {
            throw new EdmException("Item must have a tare.");
        }

        if (item.Tare is not null)
        {
            // avoid inserting a chosen tare type
            item.Tare.TareType = null;
            // be sure inserting new tare
            item.Tare.Id = Guid.Empty;
            var tare = await _tareService.Save(item.Tare);
            item.TareId = tare.Id;
        }

        item.Tare = null;
        
        return await base.Save(item);
    }

    public async Task<IEnumerable<Item>> Search(ItemSearchQuery query)
    {
        // TODO Use materialized view to gain performance
        var items = await Set().AsNoTracking()
            .Include(i => i.Tare.TareType)
            .Include(i => i.Nomenclature)
            .Include(e => e.Meta)
            .Include(i => i.Items)
            .Where(i => (query.Active && i.Meta.Deleted == null || !query.Active && i.Meta.Deleted != null)
                        && (query.NomenclatureId == null || query.NomenclatureId == i.NomenclatureId)
                        && (query.OriginId == null || query.OriginId == i.OriginId)
                        && i.OrderId == null)
            .Select(i => new Item
            {
                Id = i.Id,
                NomenclatureId = i.NomenclatureId,
                OriginId = i.OriginId,
                OrderId = i.OrderId,
                TareId = i.TareId,
                Nomenclature = i.Nomenclature,
                Tare = i.Tare,
                Meta = i.Meta,
                Quantity = i.Quantity - i.Items.Sum(i => i.Quantity),
            })
            .Where(i => i.Quantity > 0)
            .ToListAsync();
            
        return items;
    }
}