using System;
using System.Linq;
using System.Linq.Expressions;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microprojects.Edm.Ui.Logistics.Utils;
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
            .Include(i => i.Supply)
            .Include(i => i.Order).ThenInclude(o => o.Process)
            .Include(i => i.Process)
            .FirstOrDefaultAsync(i => id == i.Id);
        return result;
    }

    public override async Task<IEnumerable<Item>> GetAll(Expression<Func<Item, bool>>? predicate = null)
    {
        var query = Set().AsNoTracking()
            .Include(i => i.Tare.TareType)
            .Include(i => i.Nomenclature)
            .Include(e => e.Meta)
            .Active();

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        return await query.ToListAsync();
    }

    public override async Task<Item> Save(Item item)
    {
        // Pre-load existing row once so server-controlled fields (ProcessId,
        // SupplyId) the UI DTO doesn't carry are restored before validation.
        // Outputs are the only items allowed to be tare-less, and the UI never
        // sends ProcessId — so updates of an output would otherwise look like
        // a brand-new tare-less store item and get rejected.
        if (item.Id != Guid.Empty)
        {
            var existing = await Set<Item>().AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == item.Id);
            if (existing != null)
            {
                item.ProcessId ??= existing.ProcessId;
                item.SupplyId ??= existing.SupplyId;
            }
        }

        await ResolveTareReference(item);

        var hasTare = item.TareId is { } id && id != Guid.Empty;
        if (!hasTare)
        {
            if (item.ProcessId == null)
            {
                throw new EdmException("Item must have a tare.");
            }
            item.Address = null;
            item.Tare = null;
        }
        else
        {
            await ValidateTareAddress(item);
            item.Tare = null;
        }

        await base.Save(item);
        // Reload so callers get the full tare info (TareType included).
        return await Set().AsNoTracking()
            .Include(i => i.Tare.TareType)
            .FirstAsync(i => i.Id == item.Id);
    }

    /// <summary>
    /// When the UI sends a Tare object, reuse the existing tare by Id (or
    /// barcode+type) if any, otherwise create one through the tare service.
    /// Sets <see cref="Item.TareId"/> as a side effect.
    /// </summary>
    private async Task ResolveTareReference(Item item)
    {
        if (item.Tare is null)
        {
            return;
        }

        var tareTypeId = item.Tare.TareTypeId;
        var existingTare = item.Tare.Id != Guid.Empty
            ? await Set<Tare>().AsNoTracking().FirstOrDefaultAsync(t => t.Id == item.Tare.Id)
            : null;
        existingTare ??= await Set<Tare>().AsNoTracking()
            .FirstOrDefaultAsync(t => t.Barcode == item.Tare.Barcode && t.TareTypeId == tareTypeId);

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

    private async Task ValidateTareAddress(Item item)
    {
        var tare = await Set<Tare>().AsNoTracking()
            .Include(t => t.TareType)
            .FirstOrDefaultAsync(t => t.Id == item.TareId)
            ?? throw new EdmException("Tare not found for assigned tare.");
        if (tare.TareType == null)
        {
            throw new EdmException("Tare type not found for assigned tare.");
        }

        if (tare.TareType.Dimensions <= 0)
        {
            item.Address = null;
            return;
        }

        var nomenclature = await Set<Nomenclature>().AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == item.NomenclatureId)
            ?? throw new EdmException("Nomenclature not found for item.");

        if (!nomenclature.Countable)
        {
            if (item.Address != null)
            {
                throw new EdmException("Address must be empty for non-countable nomenclatures.");
            }
            return;
        }

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
            .Active()
            .AnyAsync(i =>
                i.TareId == item.TareId &&
                i.Address == item.Address &&
                i.Id != item.Id);
        if (alreadyUsed)
        {
            throw new EdmException("Address is already in use for this tare.");
        }
    }

    public async Task<IEnumerable<Item>> Search(ItemSearchQuery query)
    {
        // TODO Use materialized view to gain performance
        var linkSet = Db.Set<ItemLink>();
        var orderSet = Db.Set<Order>();
        var baseQuery = Set().AsNoTracking()
            .Include(i => i.Tare.TareType)
            .Include(i => i.Nomenclature).ThenInclude(n => n.DefaultTareType)
            .Include(i => i.Grade)
            .Include(e => e.Meta);
        var lifecycleScoped = query.Active ? baseQuery.Active() : baseQuery.Inactive();
        var items = await lifecycleScoped
            .Where(i =>
                        (query.NomenclatureId == null || query.NomenclatureId == i.NomenclatureId)
                        // Available stock: no current OrderId, or it's an output still
                        // sitting in its producing order (OrderId == producing order). Once
                        // an output is allocated as input to a downstream order, AddItem
                        // overwrites OrderId; the join below stops matching and the item
                        // drops out of the lookup.
                        && (i.OrderId == null
                            || (i.ProcessId != null
                                && orderSet.Any(o => o.Id == i.OrderId && o.ProcessId == i.ProcessId))))
            .Select(i => new Item
            {
                Id = i.Id,
                NomenclatureId = i.NomenclatureId,
                OrderId = i.OrderId,
                ProcessId = i.ProcessId,
                SupplyId = i.SupplyId,
                TareId = i.TareId,
                Address = i.Address,
                SerialNo = i.SerialNo,
                Nomenclature = i.Nomenclature,
                Tare = i.Tare,
                GradeId = i.GradeId,
                Grade = i.Grade,
                Meta = i.Meta,
                // Available = original Quantity minus every outgoing
                // ItemLink (allocation/repack splits AND execution
                // consumption). Item.Quantity itself is immutable.
                Quantity = i.Quantity - linkSet
                    .Where(l => l.SourceItemId == i.Id)
                    .Sum(l => (double?)l.ConsumedQuantity) ?? 0,
            })
            .Where(i => i.Quantity > 0)
            .ToListAsync();

        return items;
    }

    public async Task<ItemGenealogy> GetGenealogy(Guid rootItemId, int depth)
    {
        const int MaxNodes = 200;
        // A non-positive depth means "whole tree"; capped by MaxNodes for safety.
        var effectiveDepth = depth <= 0 ? int.MaxValue : depth;

        var root = await Set().AsNoTracking()
            .Include(i => i.Nomenclature)
            .Include(i => i.Tare).ThenInclude(t => t!.TareType)
            .Include(i => i.Meta)
            .FirstOrDefaultAsync(i => i.Id == rootItemId);

        if (root == null)
        {
            throw new EdmException($"Item {rootItemId} not found.");
        }

        var links = Db.Set<ItemLink>().AsNoTracking();

        var nodes = new Dictionary<Guid, ItemNode>
        {
            [root.Id] = ToNode(root, 0),
        };
        var edges = new List<GenealogyEdge>();
        var truncated = false;

        // Walk lineage in both directions through ItemLink. Ancestors move
        // UP (TargetItemId -> SourceItemId, depth -d); descendants move DOWN
        // (SourceItemId -> TargetItemId, depth +d).
        truncated |= await WalkGenealogy(links, root.Id, effectiveDepth, MaxNodes,
            direction: -1, nodes, edges);
        if (!truncated)
        {
            truncated = await WalkGenealogy(links, root.Id, effectiveDepth, MaxNodes,
                direction: 1, nodes, edges);
        }

        return new ItemGenealogy
        {
            RootId = root.Id,
            Depth = depth,
            Truncated = truncated,
            Nodes = nodes.Values.OrderBy(n => n.Depth).ToList(),
            Edges = edges,
        };
    }

    private static ItemNode ToNode(Item i, int depth) => new()
    {
        Id = i.Id,
        SerialNo = i.SerialNo,
        Quantity = i.Quantity,
        NomenclatureId = i.NomenclatureId,
        NomenclatureName = i.Nomenclature?.Name,
        NomenclatureCategory = i.Nomenclature?.Category.ToString(),
        NomenclatureCountable = i.Nomenclature?.Countable ?? false,
        TareId = i.TareId,
        TareBarcode = i.Tare?.Barcode,
        TareTypeName = i.Tare?.TareType?.Name,
        TareTypeUnits = i.Tare?.TareType?.Units,
        Address = i.Address,
        OrderId = i.OrderId,
        IsOutput = i.ProcessId != null,
        Depth = depth,
        Inactive = i.Meta?.Deleted != null || i.Meta?.Completed != null,
    };

    /// <summary>
    /// BFS over <see cref="ItemLink"/> from <paramref name="rootId"/> in the
    /// given <paramref name="direction"/> (-1 = ancestors, +1 = descendants).
    /// Adds visited items to <paramref name="nodes"/> and edges to
    /// <paramref name="edges"/>; returns true when the walk had to stop early
    /// (node cap or one-level-beyond probe).
    /// </summary>
    private async Task<bool> WalkGenealogy(
        IQueryable<ItemLink> links,
        Guid rootId,
        int effectiveDepth,
        int maxNodes,
        int direction,
        Dictionary<Guid, ItemNode> nodes,
        List<GenealogyEdge> edges)
    {
        // Pivot: ancestors look up by TargetItemId and add SourceItemId nodes;
        // descendants look up by SourceItemId and add TargetItemId nodes.
        var goingUp = direction < 0;
        var truncated = false;

        var frontier = new HashSet<Guid> { rootId };
        for (var d = 1; d <= effectiveDepth; d++)
        {
            if (frontier.Count == 0) { break; }

            var captured = frontier;
            var stepLinks = await (goingUp
                    ? links.Where(l => captured.Contains(l.TargetItemId))
                    : links.Where(l => captured.Contains(l.SourceItemId)))
                .Select(l => new
                {
                    l.SourceItemId,
                    l.TargetItemId,
                    l.ConsumedQuantity,
                    l.OrderProcessId,
                    ProcessName = l.OrderProcess != null && l.OrderProcess.Process != null
                        ? l.OrderProcess.Process.Name
                        : null,
                })
                .ToListAsync();

            if (stepLinks.Count == 0) { break; }

            var newFrontier = new HashSet<Guid>();
            foreach (var l in stepLinks)
            {
                edges.Add(new GenealogyEdge
                {
                    SourceItemId = l.SourceItemId,
                    TargetItemId = l.TargetItemId,
                    ConsumedQuantity = l.ConsumedQuantity,
                    OrderProcessId = l.OrderProcessId,
                    ProcessName = l.ProcessName,
                });
                var nextId = goingUp ? l.SourceItemId : l.TargetItemId;
                if (!nodes.ContainsKey(nextId))
                {
                    newFrontier.Add(nextId);
                }
            }

            if (newFrontier.Count == 0) { break; }

            var step = await Set().AsNoTracking()
                .Include(i => i.Nomenclature)
                .Include(i => i.Tare).ThenInclude(t => t!.TareType)
                .Include(i => i.Meta)
                .Where(i => newFrontier.Contains(i.Id))
                .ToListAsync();

            var depth = direction * d;
            foreach (var i in step)
            {
                nodes[i.Id] = ToNode(i, depth);
                if (nodes.Count >= maxNodes)
                {
                    truncated = true;
                    break;
                }
            }

            if (truncated) { break; }
            frontier = newFrontier;
        }

        if (!truncated)
        {
            // Probe one level beyond to flag truncation on the explored side.
            var beyond = await (goingUp
                ? links.Where(l => frontier.Contains(l.TargetItemId)).Select(l => l.SourceItemId)
                : links.Where(l => frontier.Contains(l.SourceItemId)).Select(l => l.TargetItemId))
                .AnyAsync();
            if (beyond && effectiveDepth != int.MaxValue)
            {
                truncated = true;
                foreach (var id in frontier)
                {
                    if (nodes.TryGetValue(id, out var n) && Math.Sign(n.Depth) == direction)
                    {
                        n.HasMore = true;
                    }
                }
            }
        }

        return truncated;
    }

    public async Task<BatchCreateItemResult> BatchCreate(BatchCreateItemRequest request)
    {
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

        if (TareRules.IsCountableBulk(tareType))
        {
            TareRules.EnsureIntegerQuantity(request.Quantity, "countable bulk tares");
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
                .Active()
                .Where(i => i.TareId == tare.Id)
                .ToListAsync();

            var availableInTare = await ItemHistory.GetAvailableQuantities(Db, itemsInTare);
            used = TareRules.UsedCapacity(tareType, itemsInTare, availableInTare);
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

        if (nomenclature.Countable && TareRules.IsAddressed(tareType))
        {
            TareRules.EnsureIntegerQuantity(request.Quantity, "addressed countable tares");
            var count = (int)Math.Round(request.Quantity);
            var occupiedAddresses = await Set<Item>().AsNoTracking()
                .Include(i => i.Meta)
                .Active()
                .Where(i => i.TareId == tare.Id && i.Address != null)
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
            if (nomenclature.Countable && TareRules.IsCountableBulk(tareType))
            {
                TareRules.EnsureIntegerQuantity(request.Quantity, "countable bulk tares");
                request.Quantity = Math.Round(request.Quantity);
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

        var dtos = createdItems.Select(i => new ItemViewModel
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
            // Batch-created items have no ProcessId and no parent ItemLink, so
            // IsStore reduces to SupplyId == null. Use the canonical helper
            // anyway so the rule has one home.
        }).ToList();
        await ItemFlags.Apply(Db, dtos);

        return new BatchCreateItemResult
        {
            CreatedCount = createdItems.Count,
            Quantity = createdItems.Sum(i => i.Quantity),
            Units = tareType.Units,
            Countable = nomenclature.Countable,
            TareId = tare.Id,
            TareBarcode = tare.Barcode,
            TareTypeName = tareType.Name,
            Remaining = finalRemaining,
            Items = dtos,
        };
    }

    public async Task<IEnumerable<Item>> GetByTare(Guid tareId)
    {
        var items = await Set().AsNoTracking()
            .Include(i => i.Nomenclature).ThenInclude(n => n.DefaultTareType)
            .Include(i => i.Tare.TareType)
            .Include(i => i.Grade)
            .Include(i => i.Meta)
            .Active()
            .Where(i => i.TareId == tareId)
            .ToListAsync();

        return items;
    }

    public async Task<RepackResult> Repack(RepackRequest request)
    {
        const double eps = TareRules.Eps;

        var errors = new List<string>();
        var movedCount = 0;
        var movedQuantity = 0.0;
        string? units = null;
        var countable = false;

        await using var transaction = await Db.Database.BeginTransactionAsync();
        try
        {
            foreach (var move in request.Moves)
            {
                var item = await Set()
                    .Include(i => i.Meta)
                    .Include(i => i.Nomenclature)
                    .Include(i => i.Tare).ThenInclude(t => t.TareType)
                    .Active()
                    .FirstOrDefaultAsync(i => i.Id == move.SourceItemId);

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

                // Available = Item.Quantity minus prior non-execution splits.
                // Repack no longer mutates the parent, so we must subtract any
                // earlier allocation/repack splits before deciding full-vs-partial.
                var sourceAvailable = await ItemHistory.GetAvailableQuantity(Db, item);

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
                var isTargetAddressed = TareRules.IsAddressed(targetType);

                // Enforce integer-only quantities for countable bulk tares (source and target).
                var endpointIsCountableBulk =
                    (sourceType != null && TareRules.IsCountableBulk(sourceType)) ||
                    TareRules.IsCountableBulk(targetType);
                if (endpointIsCountableBulk && Math.Abs(move.Quantity - Math.Round(move.Quantity)) > eps)
                {
                    errors.Add($"Quantity must be an integer for countable bulk tare move (item {move.SourceItemId}).");
                    continue;
                }

                if (move.TargetAddress.HasValue && isTargetAddressed)
                {
                    var addressTaken = await Set()
                        .Include(i => i.Meta)
                        .Active()
                        .AnyAsync(i =>
                            i.TareId == move.TargetTareId &&
                            i.Address == move.TargetAddress &&
                            i.Id != item.Id);

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
                        .Active()
                        .Where(i => i.TareId == move.TargetTareId)
                        .ToListAsync();

                    var availableInTarget = await ItemHistory.GetAvailableQuantities(Db, itemsInTarget);
                    var remaining = targetType.Capacity - TareRules.UsedCapacity(targetType, itemsInTarget, availableInTarget);
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

                    if (Math.Abs(sourceAvailable - 1) > eps || Math.Abs(move.Quantity - 1) > eps)
                    {
                        errors.Add($"Addressed tares require whole-item moves (quantity=1) for item {move.SourceItemId}.");
                        continue;
                    }

                    item.TareId = move.TargetTareId;
                    item.Address = move.TargetAddress;
                    movedCount++;
                    movedQuantity += move.Quantity;
                    units ??= targetType.Units;
                    countable = item.Nomenclature?.Countable ?? countable;
                    continue;
                }

                // Bulk move: full move flips TareId on the parent; partial
                // move splits off a child. The parent's Quantity is never
                // mutated — non-execution links are the sole record of splits
                // and the source-of-truth for "available".
                if (move.Quantity >= sourceAvailable - eps)
                {
                    item.TareId = move.TargetTareId;
                    item.Address = null;
                    movedCount++;
                    movedQuantity += move.Quantity;
                    units ??= targetType.Units;
                    countable = item.Nomenclature?.Countable ?? countable;
                    continue;
                }

                var newItem = new Item
                {
                    Id = Guid.Empty,
                    NomenclatureId = item.NomenclatureId,
                    TareId = move.TargetTareId,
                    Address = null,
                    Quantity = move.Quantity,
                    SupplyId = item.SupplyId,
                };
                await base.Save(newItem);

                // Lineage edge: the new child was split off the original item.
                // No OrderProcess because repack is not part of order execution.
                Db.Add(new ItemLink
                {
                    Id = DomainObject.NewGuid(),
                    SourceItemId = item.Id,
                    TargetItemId = newItem.Id,
                    ConsumedQuantity = move.Quantity,
                    OrderProcessId = null,
                });

                movedCount++;
                movedQuantity += move.Quantity;
                units ??= targetType.Units;
                countable = item.Nomenclature?.Countable ?? countable;
            }

            await Db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            errors.Add($"Transaction failed: {ex.Message}");
        }

        return new RepackResult
        {
            MovedCount = movedCount,
            MovedQuantity = movedQuantity,
            Units = units,
            Countable = countable,
            Errors = errors.ToArray(),
        };
    }

}