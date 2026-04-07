using System;
using System.Linq;
using System.Linq.Expressions;
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

    public override async Task<IEnumerable<Item>> GetAll(Expression<Func<Item, bool>>? predicate = null)
    {
        var query = Set().AsNoTracking()
            .Include(i => i.Tare.TareType)
            .Include(i => i.Nomenclature)
            .Include(e => e.Meta)
            .Where(e => e.Meta.Deleted == null);

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        return await query.ToListAsync();
    }

    public override async Task<Item> Save(Item item)
    {
        // Technology-produced target items are created without a tare; the operator assigns it later.
        if (item.Tare is null && (item.TareId == null || item.TareId == Guid.Empty))
        {
            if (item.ProcessId == null)
            {
                // UI DTOs don't carry ProcessId; allow tare-less saves when the existing DB row is a target.
                if (item.Id != Guid.Empty)
                {
                    var existing = await Set<Item>()
                        .AsNoTracking()
                        .FirstOrDefaultAsync(i => i.Id == item.Id);

                    if (existing?.ProcessId == null)
                    {
                        throw new EdmException("Item must have a tare.");
                    }
                }
                else
                {
                    throw new EdmException("Item must have a tare.");
                }
            }

            // No tare => no address.
            item.Address = null;
        }
        else if (item.Tare is not null)
        {
            // If the UI provided tare details, reuse an existing tare by barcode+type.
            var tareTypeId = item.Tare.TareTypeId;
            if (item.Tare.Id == Guid.Empty || item.Tare.Id == Guid.Empty)
            {
                // Just a safety guard; Id is expected to be empty when UI creates a new tare.
                item.Tare.Id = Guid.Empty;
            }

            var existingTare = await Set<Tare>()
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == item.Tare.Id);

            // Prefer barcode+type reuse when Id is empty.
            if (existingTare == null)
            {
                existingTare = await Set<Tare>()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Barcode == item.Tare.Barcode && t.TareTypeId == tareTypeId);
            }

            if (existingTare != null)
            {
                item.TareId = existingTare.Id;
            }
            else
            {
                // Avoid inserting a chosen tare type as a new entity.
                item.Tare.TareType = null;
                item.Tare.Id = Guid.Empty;
                var tare = await _tareService.Save(item.Tare);
                item.TareId = tare.Id;
            }
        }

        // If tare isn't assigned, address must be empty.
        if (item.TareId == null || item.TareId == Guid.Empty)
        {
            item.Address = null;
            item.Tare = null;
        }
        else
        {
            // When tare is assigned, validate address rules.
            var tare = await Set<Tare>()
                .AsNoTracking()
                .Include(t => t.TareType)
                .FirstOrDefaultAsync(t => t.Id == item.TareId);

            if (tare?.TareType == null)
            {
                throw new EdmException("Tare type not found for assigned tare.");
            }

            // Enforce address only when the tare has addressed slots.
            if (tare.TareType.Dimensions <= 0)
            {
                item.Address = null;
            }
            else
            {
                var nomenclature = await Set<Nomenclature>()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(n => n.Id == item.NomenclatureId);

                if (nomenclature == null)
                {
                    throw new EdmException("Nomenclature not found for item.");
                }

                if (nomenclature.Countable)
                {
                    if (item.Address == null)
                    {
                        throw new EdmException("Address is required for countable nomenclatures.");
                    }

                    if (item.Address < 1 || item.Address > tare.TareType.Capacity)
                    {
                        throw new EdmException(
                            $"Address must be in range 1..{tare.TareType.Capacity} for this tare.");
                    }

                    var alreadyUsed = await Set<Item>()
                        .Include(i => i.Meta)
                        .AnyAsync(i =>
                            i.TareId == item.TareId &&
                            i.Address == item.Address &&
                            i.Id != item.Id &&
                            i.Meta.Deleted == null);

                    if (alreadyUsed)
                    {
                        throw new EdmException("Address is already in use for this tare.");
                    }
                }
                else
                {
                    if (item.Address != null)
                    {
                        throw new EdmException("Address must be empty for non-countable nomenclatures.");
                    }
                }
            }

            item.Tare = null;
        }
        await base.Save(item);
        // Required to return item with full tare info
        item = await Set().AsNoTracking()
            .Include(i => i.Tare.TareType)
            .FirstAsync(i => i.Id == item.Id);
        return item;
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
                Address = i.Address,
                SerialNo = i.SerialNo,
                Shipment = i.Shipment,
                ShipmentExternalId = i.ShipmentExternalId,
                Nomenclature = i.Nomenclature,
                Tare = i.Tare,
                Meta = i.Meta,
                Quantity = i.Quantity - i.Items.Sum(i => i.Quantity),
            })
            .Where(i => i.Quantity > 0)
            .ToListAsync();
            
        return items;
    }

    public async Task<IEnumerable<ItemLinkViewModel>> GetLinksForTarget(Guid targetItemId)
    {
        return await Db.Set<ItemLink>()
            .AsNoTracking()
            .Where(l => l.TargetItemId == targetItemId)
            .Select(l => new ItemLinkViewModel
            {
                Id = l.Id,
                OrderProcessId = l.OrderProcessId,
                SourceItemId = l.SourceItemId,
                SourceSerialNo = l.SourceItem.SerialNo,
                SourceNomenclatureName = l.SourceItem.Nomenclature.Name,
                SourceTareBarcode = l.SourceItem.Tare != null ? l.SourceItem.Tare.Barcode : null,
                SourceTareTypeName = l.SourceItem.Tare != null ? l.SourceItem.Tare.TareType.Name : null,
                SourceTareTypeUnits = l.SourceItem.Tare != null ? l.SourceItem.Tare.TareType.Units : null,
                SourceAddress = l.SourceItem.Address,

                TargetItemId = l.TargetItemId,
                TargetNomenclatureName = l.TargetItem.Nomenclature.Name,
                TargetTareBarcode = l.TargetItem.Tare != null ? l.TargetItem.Tare.Barcode : null,
                TargetAddress = l.TargetItem.Address,

                ConsumedQuantity = l.ConsumedQuantity
            })
            .ToListAsync();
    }
}