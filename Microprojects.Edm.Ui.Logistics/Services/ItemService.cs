using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class ItemService : ServiceBase<Item>, IItemService
{
    private readonly ITareService _tareService;

    public ItemService()
    {
    }

    public ItemService(LogisticsContext db, ITareService tareService) : base(db)
    {
        _tareService = tareService;
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
        if (item.Tare is null)
        {
            throw new EdmException("Supply must have a tare.");
        }

        // avoid inserting chosen tare type
        item.Tare.TareType = null;
        // be sure inserting new tare
        item.Tare.Id = Guid.Empty;
        var tare = await _tareService.Save(item.Tare);
        item.TareId = tare.Id;
        item.Tare = null;
        return await base.Save(item);
    }
}