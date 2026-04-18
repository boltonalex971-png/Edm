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
            .Include(i => i.Tare.TareType)
            .Include(i => i.Meta)
            .FirstOrDefaultAsync(i => id == i.Id);
        return result;
    }

    public override async Task<IEnumerable<Item>> GetAll(Expression<Func<Item, bool>>? predicate = null)
    {
        var query = Set().AsNoTracking()
            .Include(i => i.Tare.TareType)
            .Include(i => i.Nomenclature)
            .Include(e => e.Meta)
            .Where(e => e.Meta.Deleted == null && e.Meta.Completed == null);

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
                            i.Meta.Deleted == null &&
                            i.Meta.Completed == null);

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
            .Where(i =>
                        (query.Active
                            ? (i.Meta.Deleted == null && i.Meta.Completed == null)
                            : (i.Meta.Deleted != null || i.Meta.Completed != null))
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
                Nomenclature = i.Nomenclature,
                Tare = i.Tare,
                Meta = i.Meta,
                Quantity = i.Quantity - i.Items.Sum(i => i.Quantity),
            })
            .Where(i => i.Quantity > 0)
            .ToListAsync();
            
        return items;
    }

    public async Task<BatchCreateItemResult> BatchCreate(BatchCreateItemRequest request)
    {
        var eps = 1e-9;

        var nomenclature = await Set<Nomenclature>().AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == request.NomenclatureId)
            ?? throw new EdmException("Nomenclature not found.");

        var tareType = await Set<TareType>().AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == request.TareTypeId)
            ?? throw new EdmException("Tare type not found.");

        if (request.Quantity <= 0)
        {
            throw new EdmException("Quantity must be greater than zero.");
        }

        var isCountableBulkTare = tareType.Countable && tareType.Dimensions <= 0;
        if (isCountableBulkTare)
        {
            var rounded = Math.Round(request.Quantity);
            if (Math.Abs(request.Quantity - rounded) > eps)
            {
                throw new EdmException("Quantity must be an integer for countable bulk tares.");
            }
        }

        Tare tare;
        double used;

        if (request.TareId.HasValue && request.TareId != Guid.Empty)
        {
            tare = await Set<Tare>().AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == request.TareId.Value)
                ?? throw new EdmException("Tare not found.");

            if (tare.TareTypeId != request.TareTypeId)
            {
                throw new EdmException("Tare type mismatch.");
            }

            var itemsInTare = await Set<Item>().AsNoTracking()
                .Include(i => i.Meta)
                .Where(i => i.TareId == tare.Id && i.Meta.Deleted == null && i.Meta.Completed == null)
                .ToListAsync();

            used = tareType.Dimensions > 0 && tareType.Countable
                ? itemsInTare.Count
                : itemsInTare.Sum(i => i.Quantity);
        }
        else
        {
            tare = new Tare
            {
                Id = Guid.Empty,
                Barcode = request.Barcode,
                TareTypeId = request.TareTypeId,
            };
            tare = await _tareService.Save(tare);
            used = 0;
        }

        var remaining = tareType.Capacity - used;
        if (request.Quantity > remaining)
        {
            throw new EdmException(
                $"Quantity {request.Quantity} exceeds remaining capacity {remaining}.");
        }

        var createdItems = new List<Item>();

        if (nomenclature.Countable && tareType.Dimensions > 0)
        {
            var count = (int)Math.Round(request.Quantity);
            if (Math.Abs(request.Quantity - count) > eps)
            {
                throw new EdmException("Quantity must be an integer for addressed countable tares.");
            }
            var occupiedAddresses = await Set<Item>().AsNoTracking()
                .Include(i => i.Meta)
                .Where(i => i.TareId == tare.Id && i.Meta.Deleted == null && i.Meta.Completed == null && i.Address != null)
                .Select(i => i.Address!.Value)
                .ToListAsync();

            var nextAddress = 1;
            for (var i = 0; i < count; i++)
            {
                while (occupiedAddresses.Contains(nextAddress))
                {
                    nextAddress++;
                }

                var item = new Item
                {
                    Id = Guid.Empty,
                    NomenclatureId = request.NomenclatureId,
                    TareId = tare.Id,
                    Address = nextAddress,
                    Quantity = 1,
                    SupplyId = request.SupplyId,
                };
                await base.Save(item);
                createdItems.Add(item);
                occupiedAddresses.Add(nextAddress);
                nextAddress++;
            }
        }
        else
        {
            if (nomenclature.Countable && isCountableBulkTare)
            {
                var rounded = Math.Round(request.Quantity);
                if (Math.Abs(request.Quantity - rounded) > eps)
                {
                    throw new EdmException("Quantity must be an integer for countable bulk tares.");
                }
                request.Quantity = rounded;
            }

            var item = new Item
            {
                Id = Guid.Empty,
                NomenclatureId = request.NomenclatureId,
                TareId = tare.Id,
                Address = null,
                Quantity = request.Quantity,
                SupplyId = request.SupplyId,
            };
            await base.Save(item);
            createdItems.Add(item);
        }

        var finalRemaining = remaining - request.Quantity;

        return new BatchCreateItemResult
        {
            CreatedCount = createdItems.Count,
            TareId = tare.Id,
            TareBarcode = tare.Barcode,
            TareTypeName = tareType.Name,
            Remaining = finalRemaining,
            Items = createdItems.Select(i => new ItemViewModel
            {
                Id = i.Id,
                NomenclatureId = i.NomenclatureId,
                NomenclatureName = nomenclature.Name,
                NomenclatureCategory = nomenclature.Category.ToString(),
                TareId = i.TareId,
                TareBarcode = tare.Barcode,
                TareTareTypeId = tareType.Id,
                TareTareTypeName = tareType.Name,
                TareTareTypeUnits = tareType.Units,
                TareTareTypeSizeX = tareType.SizeX,
                TareTareTypeSizeY = tareType.SizeY,
                TareTareTypeSizeZ = tareType.SizeZ,
                TareTareTypeDimensions = tareType.Dimensions,
                TareTareTypeCapacity = tareType.Capacity,
                Address = i.Address,
                Quantity = i.Quantity,
                SupplyId = i.SupplyId,
            }),
        };
    }

    public async Task<IEnumerable<Item>> GetByTare(Guid tareId)
    {
        return await Set().AsNoTracking()
            .Include(i => i.Nomenclature)
            .Include(i => i.Tare.TareType)
            .Include(i => i.Meta)
            .Where(i => i.TareId == tareId && i.Meta.Deleted == null && i.Meta.Completed == null)
            .ToListAsync();
    }

    public async Task<RepackResult> Repack(RepackRequest request)
    {
        var eps = 1e-9;

        var errors = new List<string>();
        var movedCount = 0;

        await using var transaction = await Db.Database.BeginTransactionAsync();
        try
        {
            foreach (var move in request.Moves)
            {
                var item = await Set()
                    .Include(i => i.Meta)
                    .Include(i => i.Nomenclature)
                    .Include(i => i.Tare).ThenInclude(t => t.TareType)
                    .FirstOrDefaultAsync(i => i.Id == move.SourceItemId && i.Meta.Deleted == null && i.Meta.Completed == null);

                if (item == null)
                {
                    errors.Add($"Item {move.SourceItemId} not found or deleted.");
                    continue;
                }

                if (item.NomenclatureId != request.NomenclatureId)
                {
                    errors.Add($"Item {move.SourceItemId} does not match target nomenclature.");
                    continue;
                }

                if (move.Quantity <= 0)
                {
                    errors.Add($"Move quantity must be greater than zero for item {move.SourceItemId}.");
                    continue;
                }

                var tare = await Set<Tare>().AsNoTracking()
                    .Include(t => t.TareType)
                    .FirstOrDefaultAsync(t => t.Id == move.TargetTareId);

                if (tare == null)
                {
                    errors.Add($"Target tare {move.TargetTareId} not found.");
                    continue;
                }

                var targetType = tare.TareType ?? throw new EdmException("Target tare type not found.");
                var sourceType = item.Tare?.TareType;
                var isTargetAddressed = targetType.Dimensions > 0;

                // Enforce integer-only quantities for countable bulk tares (source and target).
                var sourceIsCountableBulkTare = sourceType != null && sourceType.Countable && sourceType.Dimensions <= 0;
                var targetIsCountableBulkTare = targetType.Countable && targetType.Dimensions <= 0;
                if (sourceIsCountableBulkTare || targetIsCountableBulkTare)
                {
                    var rounded = Math.Round(move.Quantity);
                    if (Math.Abs(move.Quantity - rounded) > eps)
                    {
                        errors.Add($"Quantity must be an integer for countable bulk tare move (item {move.SourceItemId}).");
                        continue;
                    }
                }

                if (move.TargetAddress.HasValue && tare.TareType.Dimensions > 0)
                {
                    var addressTaken = await Set()
                        .Include(i => i.Meta)
                        .AnyAsync(i =>
                            i.TareId == move.TargetTareId &&
                            i.Address == move.TargetAddress &&
                            i.Id != item.Id &&
                            i.Meta.Deleted == null &&
                            i.Meta.Completed == null);

                    if (addressTaken)
                    {
                        errors.Add($"Address {move.TargetAddress} in tare {tare.Barcode} is already occupied.");
                        continue;
                    }
                }

                // Capacity check for target tare (for bulk tares).
                if (!isTargetAddressed)
                {
                    var itemsInTarget = await Set<Item>().AsNoTracking()
                        .Include(i => i.Meta)
                        .Where(i => i.TareId == move.TargetTareId && i.Meta.Deleted == null && i.Meta.Completed == null)
                        .ToListAsync();

                    var used = targetType.Countable && targetType.Dimensions > 0
                        ? itemsInTarget.Count
                        : itemsInTarget.Sum(i => i.Quantity);

                    var remaining = targetType.Capacity - used;
                    if (move.Quantity > remaining + eps)
                    {
                        errors.Add($"Target tare {tare.Barcode} has insufficient remaining capacity ({remaining}).");
                        continue;
                    }
                }

                // Addressed tares: move whole item only (quantity=1) and require address for countable nomenclature.
                if (isTargetAddressed && item.Nomenclature?.Countable == true)
                {
                    if (!move.TargetAddress.HasValue)
                    {
                        errors.Add($"Target address is required for countable item {move.SourceItemId}.");
                        continue;
                    }

                    if (Math.Abs(item.Quantity - 1) > eps || Math.Abs(move.Quantity - 1) > eps)
                    {
                        errors.Add($"Addressed tares require whole-item moves (quantity=1) for item {move.SourceItemId}.");
                        continue;
                    }

                    item.TareId = move.TargetTareId;
                    item.Address = move.TargetAddress;
                    movedCount++;
                    continue;
                }

                // Bulk move: allow partial quantity by splitting the item.
                if (move.Quantity >= item.Quantity - eps)
                {
                    item.TareId = move.TargetTareId;
                    item.Address = null;
                    movedCount++;
                    continue;
                }

                var newItem = new Item
                {
                    Id = Guid.Empty,
                    OriginId = item.Id,
                    NomenclatureId = item.NomenclatureId,
                    TareId = move.TargetTareId,
                    Address = null,
                    Quantity = move.Quantity,
                    SupplyId = item.SupplyId,
                };
                await base.Save(newItem);

                item.Quantity -= move.Quantity;
                movedCount++;
            }

            await Db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            errors.Add($"Transaction failed: {ex.Message}");
        }

        return new RepackResult { MovedCount = movedCount, Errors = errors.ToArray() };
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