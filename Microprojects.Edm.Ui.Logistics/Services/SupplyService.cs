using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class SupplyService : ServiceBase<Supply>, ISupplyService
{
    private readonly IItemService _itemService;

    public SupplyService()
    {
    }

    public SupplyService(LogisticsContext db, IUserService userService, IItemService itemService) : base(db, userService)
    {
        _itemService = itemService;
    }

    public override async Task<Supply> Get(Guid id)
    {
        var supply = await Set().AsNoTracking()
            .Include(s => s.Meta)
            .FirstOrDefaultAsync(s => s.Id == id);
        return supply;
    }

    public override async Task<IEnumerable<Supply>> GetAll(System.Linq.Expressions.Expression<Func<Supply, bool>>? predicate = null)
    {
        var query = Set().AsNoTracking()
            .Include(s => s.Meta)
            .Where(s => s.Meta.Deleted == null);

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<Item>> GetItems(Guid supplyId)
    {
        var items = await Db.Items
            .AsNoTracking()
            .Include(i => i.Nomenclature)
            .Include(i => i.Tare.TareType)
            .Include(i => i.Meta)
            .Where(i => i.SupplyId == supplyId && i.Meta.Deleted == null)
            .ToListAsync();

        return items;
    }

    public async Task<Item> AddItem(Guid supplyId, Item item)
    {
        item.SupplyId = supplyId;
        item.Supply = null;
        item.OrderId = null;
        item.Order = null;

        return await _itemService.Save(item);
    }

    public async Task UnlinkItem(Guid supplyId, Guid itemId)
    {
        var item = await Db.Items
            .Include(i => i.Meta)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.SupplyId == supplyId);

        if (item == null)
        {
            throw new EdmException($"Item {itemId} is not linked to supply {supplyId}.");
        }

        item.SupplyId = null;
        await Db.SaveChangesAsync();
    }
}

