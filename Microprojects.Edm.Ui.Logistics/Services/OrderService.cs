using System;
using System.Linq.Expressions;
using AutoMapper;
using Microprojects.Edm.Intercom;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Events;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microprojects.Edm.Ui.Logistics.Utils;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Microsoft.EntityFrameworkCore;
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class OrderService : ServiceBase<Order>, IOrderService
{
    private const double Eps = 1e-9;

    private IItemService _itemService;
    private IMapper? _mapper;
    private IIntercom? _intercom;
    private IConnectionOrigin? _origin;

    public OrderService()
    {
    }

    public OrderService(
        LogisticsContext db,
        IUserService userService,
        IItemService itemService,
        IMapper mapper,
        IIntercom? intercom = null,
        IConnectionOrigin? origin = null) : base(db, userService)
    {
        _itemService = itemService;
        _mapper = mapper;
        _intercom = intercom;
        _origin = origin;
    }

    private void PublishOrderEvent(string kind, Guid orderId)
    {
        if (_intercom == null) return;
        try
        {
            _intercom.Publish(LogisticsMessage.Channel, new LogisticsMessage
            {
                Kind = kind,
                OrderId = orderId,
                OriginConnectionId = _origin?.ConnectionId,
            });
        }
        catch
        {
            // Hub-down resilience: swallow publish failures so domain
            // operations never fail because of a transport issue.
        }
    }

    public override async Task<Order> Get(Guid id)
    {
        var order = await Set().AsNoTracking()
            .Include(o => o.Process.Nomenclature).ThenInclude(n => n.DefaultTareType)
            .Include(o => o.Meta)
            .FirstOrDefaultAsync(o => o.Id == id);
        return order;
    }

    public override async Task<IEnumerable<Order>> GetAll(Expression<Func<Order, bool>>? predicate = null)
    {
        var query = Set().AsNoTracking()
            .Include(i => i.Process.Nomenclature).ThenInclude(n => n.DefaultTareType)
            .Include(e => e.Meta)
            .Active();

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        return await query.ToListAsync();
    }

    public override async Task<Order> Save(Order order)
    {
        if (order.Amount <= 0)
        {
            throw new EdmException("Amount must be greater than 0.");
        }
        var create = order.Id == Guid.Empty;
        // Avoid creating a new process
        order.Process = null;
        if (create && string.IsNullOrEmpty(order.Number))
        {
            order.Number = await GetNextNumber();
        }
        await base.Save(order);
        if (create)
        {
            // Inherit access groups from the chosen process's folder lineage —
            // closest ancestor with non-empty Meta.Groups wins; empty ancestors
            // mean the order is unrestricted and visible to every operator.
            var inheritedGroups = await ResolveProcessFolderGroups(order.ProcessId);
            if (inheritedGroups.Length > 0)
            {
                var meta = await Set<Meta>().FindAsync(order.Id);
                if (meta != null)
                {
                    meta.Groups = inheritedGroups;
                }
            }

            // One order -> one process. Operations within a technology process are
            // represented by OrderProcess rows only for the future integration phase;
            // today we always use a single row matching the order's root process.
            Db.Add(new OrderProcess
            {
                Id = DomainObject.NewGuid(),
                OrderId = order.Id,
                ProcessId = order.ProcessId,
                Ordering = 10,
            });
            await Db.SaveChangesAsync();
        }

        return order;
    }

    /// <summary>
    /// Walks the folder lineage above the given process and returns the groups
    /// of the closest ancestor folder that has any groups assigned. Returns an
    /// empty array when no ancestor carries groups.
    /// </summary>
    private async Task<string[]> ResolveProcessFolderGroups(Guid processId)
    {
        var process = await Set<Process>().AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == processId);
        if (process == null)
        {
            return [];
        }

        var currentId = process.DirectoryId;
        while (currentId != null)
        {
            var folder = await Set<Directory>().AsNoTracking()
                .Include(d => d.Meta)
                .FirstOrDefaultAsync(d => d.Id == currentId.Value);
            if (folder == null)
            {
                break;
            }
            if (folder.Meta is { Groups.Length: > 0 })
            {
                return folder.Meta.Groups;
            }
            currentId = folder.DirectoryId;
        }

        return [];
    }

    /// <summary>
    /// Rejects a mutation attempt when the caller is not the order's Executor
    /// and is not acting in the Admin role. Admin bypasses the restriction.
    /// </summary>
    private void AssertCanMutate(Order order)
    {
        if (string.Equals(UserService.GetUserRole(), "Admin", StringComparison.Ordinal))
        {
            return;
        }

        var user = UserService.GetUserName();
        var executor = order.Meta?.Executor;
        if (string.IsNullOrEmpty(executor))
        {
            return;
        }
        if (!string.Equals(executor, user, StringComparison.OrdinalIgnoreCase))
        {
            throw new EdmException(
                $"Order is being executed by {executor}. Only the executor or an Admin can modify it.");
        }
    }

    /// <summary>Derives the lifecycle state of the order's root process.</summary>
    public static OrderStatus DeriveStatus(
        DateTime? completed,
        DateTime? startTime,
        int pendingOutputs)
    {
        if (completed != null)
        {
            return OrderStatus.Completed;
        }
        if (startTime == null)
        {
            return OrderStatus.Draft;
        }
        return pendingOutputs > 0 ? OrderStatus.OutputsPending : OrderStatus.Running;
    }

    public async Task<IEnumerable<OrderSpecificationNomenclature>> GetSpecifications(Guid orderId,
        Guid? processId = null)
    {
        var order = await Get(orderId);

        List<Specification> specifications;
        if (processId == null)
        {
            specifications = await Set<Specification>().AsNoTracking()
                .Where(s => s.ProcessId == order.ProcessId && s.Active)
                .ToListAsync();
        }
        else
        {
            specifications = await Set<OrderProcess>().AsNoTracking()
                .Include(p => p.Process.Specifications
                    .Where(s => s.Active))
                .Where(p => p.OrderId == orderId && p.ProcessId == processId)
                .SelectMany(p => p.Process.Specifications)
                .ToListAsync();
        }
        // Inputs only (ProcessId == null) and NotDeleted so consumed inputs
        // (Meta.Completed != null after Execute) stay visible for the
        // historical view.
        var items = await Set<Item>().AsNoTracking()
            .Include(i => i.Meta)
            .NotDeleted()
            .Where(i => i.OrderId == orderId && i.ProcessId == null)
            .ToListAsync();

        // For consumed items: original allocation = sum of execution-link
        // consumption from the item.
        // For active items: currently allocated = Quantity minus any
        // non-execution outgoing splits (allocation/repack). Repack no
        // longer mutates the parent so the subtraction is always required.
        var itemIds = items.Select(i => i.Id).ToList();
        var consumedByItem = itemIds.Count == 0
            ? new Dictionary<Guid, double>()
            : (await Set<ItemLink>().AsNoTracking()
                .Where(l => l.OrderProcessId != null && itemIds.Contains(l.SourceItemId))
                .GroupBy(l => l.SourceItemId)
                .Select(g => new { Id = g.Key, Sum = g.Sum(l => l.ConsumedQuantity) })
                .ToListAsync())
                .ToDictionary(x => x.Id, x => x.Sum);
        var availableByItem = await ItemHistory.GetAvailableQuantities(Db, items);

        var rows = await Set<SpecificationNomenclature>().AsNoTracking()
            .Include(sn => sn.Nomenclature)
            .Include(sn => sn.Specification.Process)
            .Where(sn => specifications.Select(s => s.Id).Contains(sn.SpecificationId))
            .ToListAsync();
        var result = rows
            .GroupBy(r => r.NomenclatureId, (key, list) =>
            {
                var matched = items.Where(i => i.NomenclatureId == key).ToList();
                return new OrderSpecificationNomenclature
                {
                    Order = order,
                    Nomenclature = list.First().Nomenclature,
                    Quantity = list.Sum(s => s.Quantity),
                    Items = matched,
                    Total = matched.Sum(i =>
                        i.Meta.Completed != null
                            ? consumedByItem.GetValueOrDefault(i.Id, 0)
                            : availableByItem.GetValueOrDefault(i.Id, i.Quantity)),
                };
            });

        return result;
    }

    public async Task<IEnumerable<Item>> GetItems(Guid id)
    {
        // Component tab: input items only (ProcessId == null). Outputs share
        // the same OrderId and would otherwise leak in here once the order is
        // executed (they live in the Output tab). NotDeleted keeps consumed
        // inputs visible for historical lookup.
        var items = await Set<Item>().AsNoTracking()
            .Include(i => i.Nomenclature)
            .Include(i => i.Tare.TareType)
            .Include(i => i.Meta)
            .NotDeleted()
            .Where(i => i.OrderId == id && i.ProcessId == null)
            .ToListAsync();

        return items;
    }

    public async Task<IEnumerable<OrderProcess>> GetOrderProcesses(Guid id, bool asNoTracking = true)
    {
        var operations = await (asNoTracking ? Set<OrderProcess>().AsNoTracking() : Set<OrderProcess>())
            .Include(op => op.Process.Nomenclature)
            .Where(i => i.OrderId == id)
            .OrderBy(op => op.Ordering)
            .ToListAsync();

        return operations;
    }

    /// <summary>
    /// Marker exception: the order's specification for this nomenclature is
    /// already fully covered. Callers that loop over candidate items (see
    /// <see cref="AddItems"/>) treat this as a clean end-of-loop, not a
    /// stop reason worth surfacing to the user.
    /// </summary>
    private sealed class SpecificationFulfilledException : EdmException
    {
        public SpecificationFulfilledException(string message) : base(message) { }
    }

    public async Task<Item> AddItem(Guid id, Item item)
    {
        var specification = (await GetSpecifications(id))
                            .FirstOrDefault(s => s.NomenclatureId == item.NomenclatureId)
                            ?? throw new EdmException(
                                $"Specification for nomenclature {item.NomenclatureId} not found");
        if (specification.Total >= specification.Amount)
        {
            throw new SpecificationFulfilledException($"{specification.Nomenclature.Name} no more required");
        }

        var storeItem = await Set<Item>()
                            .FirstOrDefaultAsync(i => i.Id == item.Id)
                        ?? throw new EdmException($"Item with id {item.Id} not found");
        var tare = storeItem.Tare;
        var requiredAmount = specification.Amount - specification.Total;
        // Available = Quantity minus prior non-execution splits (allocation /
        // repack). Repack and AddItem no longer mutate the parent's Quantity,
        // so the raw field is the original allocation, not what's left.
        var available = await ItemHistory.GetAvailableQuantity(Db, storeItem);
        var splitQty = Math.Min(available, requiredAmount);

        // Output items (ProcessId != null) must always be split so the producing
        // order keeps the production lineage on the parent and the consuming
        // side gets a fresh non-output child input. Reassigning the OrderId in
        // place would make the item look like an output of the consuming order.
        // Raw supplies / store items have ProcessId == null and can be reassigned
        // wholesale when the quantity matches.
        if (storeItem.ProcessId == null && available <= requiredAmount)
        {
            storeItem.OrderId = id;
            await Db.SaveChangesAsync();
        }
        else
        {
            var parentId = storeItem.Id;
            storeItem = await _itemService.Save(new Item
            {
                OrderId = id,
                NomenclatureId = storeItem.NomenclatureId,
                Quantity = splitQty,
                TareId = storeItem.TareId
            });
            storeItem.Tare = tare;

            // Lineage edge: child item was split off the parent store item during
            // allocation. No OrderProcess since this is not order execution.
            Db.Add(new ItemLink
            {
                Id = DomainObject.NewGuid(),
                SourceItemId = parentId,
                TargetItemId = storeItem.Id,
                ConsumedQuantity = splitQty,
                OrderProcessId = null,
            });
            await Db.SaveChangesAsync();
        }

        return storeItem;
    }

    public async Task<AllocateItemsResult> AddItems(Guid orderId, IEnumerable<Guid> itemIds)
    {
        var allocated = 0;
        var totalQty = 0.0;
        string? stoppedReason = null;
        Guid? firstAllocatedId = null;

        foreach (var itemId in itemIds)
        {
            var storeItem = await Set<Item>().AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == itemId);

            if (storeItem == null)
            {
                continue;
            }

            try
            {
                var result = await AddItem(orderId, storeItem);
                allocated++;
                totalQty += result.Quantity;
                firstAllocatedId ??= result.Id;
            }
            catch (SpecificationFulfilledException)
            {
                break;
            }
            catch (EdmException ex)
            {
                stoppedReason = ex.Message;
                break;
            }
        }

        string? units = null;
        var countable = false;
        if (firstAllocatedId != null)
        {
            var info = await Set<Item>().AsNoTracking()
                .Where(i => i.Id == firstAllocatedId)
                .Select(i => new { i.Nomenclature.Countable, Units = i.Tare.TareType.Units })
                .FirstOrDefaultAsync();
            if (info != null)
            {
                units = info.Units;
                countable = info.Countable;
            }
        }

        return new AllocateItemsResult
        {
            AllocatedCount = allocated,
            AllocatedQuantity = totalQty,
            Units = units,
            Countable = countable,
            StoppedReason = stoppedReason,
        };
    }

    public async Task<ExecuteResult> Execute(Guid id)
    {
        var order = await Set()
            .Include(o => o.Meta)
            .Include(o => o.Process).ThenInclude(p => p.Nomenclature)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            throw new EdmException($"Order with id {id} not found");
        }

        if (order.Meta.Completed != null)
        {
            throw new EdmException("Order is already completed.");
        }

        var orderProcess = await Set<OrderProcess>()
            .Include(op => op.Process).ThenInclude(p => p.Nomenclature)
            .Where(op => op.OrderId == id)
            .OrderBy(op => op.Ordering)
            .FirstOrDefaultAsync()
            ?? throw new EdmException("Order has no process.");

        if (orderProcess.StartTime != null)
        {
            throw new EdmException("Order has already been executed.");
        }

        // First operator to launch becomes Executor and takes responsibility
        // for the order's further actions. Admin bypasses; anyone else who
        // tries to re-launch a different operator's order is rejected.
        var currentUser = UserService.GetUserName();
        if (!string.IsNullOrEmpty(order.Meta.Executor) &&
            !string.Equals(order.Meta.Executor, currentUser, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(UserService.GetUserRole(), "Admin", StringComparison.Ordinal))
        {
            throw new EdmException(
                $"Order is being executed by {order.Meta.Executor}. Only the executor or an Admin can relaunch.");
        }

        var specifications = (await GetSpecifications(id))
            .ToList();

        // Check if all required components for the process are allocated
        if (specifications.Any(n => n.Total + Eps < n.Amount))
            throw new EdmException("Not all required components are available");

        // Wrap the entire execution (output creation + input allocation + links
        // + completion state) into a single DB transaction so any failure rolls
        // back every row, including outputs persisted eagerly via
        // _itemService.Save. Otherwise a late validation error would leave
        // orphan output items and a half-started orderProcess.
        await using var transaction = await Db.Database.BeginTransactionAsync();

        var now = DateTime.UtcNow;
        orderProcess.StartTime = now;
        if (string.IsNullOrEmpty(order.Meta.Executor))
        {
            order.Meta.Executor = currentUser;
        }

        // Produce outputs from the root process nomenclature.
        var targetOutputItems = new List<Item>();
        var targetNomenclature = orderProcess.Process.Nomenclature
                                 ?? (order.Process?.NomenclatureId != null
                                     ? await Set<Nomenclature>().AsNoTracking()
                                         .FirstAsync(n => n.Id == order.Process.NomenclatureId.Value)
                                     : null);
        if (targetNomenclature != null)
        {
            if (targetNomenclature.Countable)
            {
                var rounded = Math.Round(order.Amount);
                if (Math.Abs(order.Amount - rounded) > Eps)
                {
                    throw new EdmException("Order amount must be an integer for countable output nomenclature.");
                }

                var outputCount = (int)rounded;
                for (var i = 0; i < outputCount; i++)
                {
                    var outputItem = await _itemService.Save(new Item
                    {
                        NomenclatureId = targetNomenclature.Id,
                        OrderId = id,
                        ProcessId = orderProcess.ProcessId,
                        Quantity = 1,
                        Tare = null,
                        TareId = null,
                        Address = null
                    });
                    targetOutputItems.Add(outputItem);
                }
            }
            else
            {
                var outputItem = await _itemService.Save(new Item
                {
                    NomenclatureId = targetNomenclature.Id,
                    OrderId = id,
                    ProcessId = orderProcess.ProcessId,
                    Quantity = order.Amount,
                    Tare = null,
                    TareId = null,
                    Address = null
                });
                targetOutputItems.Add(outputItem);
            }
        }

        // Allocate inputs to produced outputs and persist links.
        foreach (var spec in specifications)
        {
            var inputItems = await Set<Item>()
                .Include(i => i.Meta)
                .Active()
                .Where(i =>
                    i.OrderId == order.Id &&
                    i.NomenclatureId == spec.NomenclatureId)
                .OrderBy(i => i.Id) // UUIDv7 ordering: FIFO by creation time
                .ToListAsync();

            // Available = Quantity minus prior non-execution splits (Repack /
            // allocation children created off this item). Execute consumes
            // against available, not raw Quantity, so an item that had part
            // of its volume split off earlier is not over-consumed.
            var availableByItem = (await ItemHistory.GetAvailableQuantities(Db, inputItems))
                .ToDictionary(kv => kv.Key, kv => kv.Value);

            if (targetOutputItems.Count == 0)
            {
                // No output items -> consume the required quantity without persisting links.
                // Item.Quantity stays immutable; available is tracked in the dict and
                // Meta.Completed is stamped when an item's available drops to zero.
                var remaining = spec.Amount;
                foreach (var item in inputItems)
                {
                    if (remaining <= Eps)
                        break;

                    // Execute is a logical, ratio-based consumption step. It
                    // does not reshape tare contents, so we do not enforce the
                    // "integer pieces" rule here even when the input sits on a
                    // countable bulk tare. Decimal residuals are allowed — see
                    // the comment on Nomenclature.Countable. Physical
                    // piece-count integrity is enforced by tare operations
                    // (BatchCreate, Move, Repack).
                    var availableHere = availableByItem[item.Id];
                    var consumed = Math.Min(availableHere, remaining);
                    availableByItem[item.Id] = availableHere - consumed;
                    remaining -= consumed;
                    if (availableByItem[item.Id] <= Eps)
                    {
                        item.Meta.Completed = now;
                    }
                }

                if (remaining > Eps)
                {
                    throw new EdmException("Not enough input quantity to consume.");
                }

                continue;
            }

            var inputIndex = 0;
            foreach (var targetItem in targetOutputItems)
            {
                var requiredForThisTarget = spec.Quantity * targetItem.Quantity;
                while (requiredForThisTarget > Eps)
                {
                    if (inputIndex >= inputItems.Count)
                    {
                        throw new EdmException("Not enough input quantity to allocate required output.");
                    }

                    var inputItem = inputItems[inputIndex];

                    var available = availableByItem[inputItem.Id];
                    if (available <= Eps)
                    {
                        inputItem.Meta.Completed = now;
                        inputIndex++;
                        continue;
                    }

                    // See the sibling loop above: Execute consumes by ratio
                    // and does not reshape tare contents, so the countable-bulk
                    // integer rule is not enforced here. Tare integrity is
                    // enforced at tare-touching operations instead.
                    var consumed = Math.Min(available, requiredForThisTarget);

                    Db.ItemLinks.Add(new ItemLink
                    {
                        Id = DomainObject.NewGuid(),
                        OrderProcessId = orderProcess.Id,
                        SourceItemId = inputItem.Id,
                        TargetItemId = targetItem.Id,
                        ConsumedQuantity = consumed
                    });

                    // Item.Quantity is immutable; consumption is recorded only
                    // through the link above. Track depletion in the dict so we
                    // know when to stamp Meta.Completed.
                    availableByItem[inputItem.Id] = available - consumed;
                    requiredForThisTarget -= consumed;

                    if (availableByItem[inputItem.Id] <= Eps)
                    {
                        inputItem.Meta.Completed = now;
                        inputIndex++;
                    }
                }
            }
        }

        orderProcess.EndTime = now;

        // If there are no pending (untared) output items, close the order immediately.
        var pendingCount = targetOutputItems.Count(oi => oi.TareId == null || oi.TareId == Guid.Empty);
        if (pendingCount == 0)
        {
            order.Meta.Completed = now;
        }

        await Db.SaveChangesAsync();
        await transaction.CommitAsync();

        PublishOrderEvent(LogisticsEventKinds.OrderExecuted, id);
        if (pendingCount == 0)
        {
            PublishOrderEvent(LogisticsEventKinds.OrderCompleted, id);
        }

        return new ExecuteResult
        {
            Completed = pendingCount == 0,
            PendingCount = pendingCount,
        };
    }

    public async Task<OrderOutputItems> GetOutputItems(Guid orderId)
    {
        var order = await Set().AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId);

        var items = await Set<Item>().AsNoTracking()
            .Include(i => i.Nomenclature).ThenInclude(n => n.DefaultTareType)
            .Include(i => i.Tare).ThenInclude(t => t.TareType)
            .Include(i => i.Grade)
            .Include(i => i.Meta)
            .Active()
            .Where(i =>
                i.OrderId == orderId &&
                i.ProcessId != null)
            .ToListAsync();

        var allocated = items.Where(i => i.TareId != null).ToList();
        var unallocated = items.Where(i => i.TareId == null).ToList();

        return new OrderOutputItems
        {
            ProcessId = order?.ProcessId,
            Allocated = _mapper != null
                ? _mapper.Map<IEnumerable<ItemViewModel>>(allocated)
                : [],
            Unallocated = _mapper != null
                ? _mapper.Map<IEnumerable<ItemViewModel>>(unallocated)
                : [],
        };
    }

    public async Task<AllocateOutputsResult> AllocateOutputs(Guid orderId, IEnumerable<OutputAllocation> allocations)
    {
        var order = await Set()
            .Include(o => o.Meta)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new EdmException($"Order with id {orderId} not found");
        AssertCanMutate(order);

        var errors = new List<string>();
        var allocated = 0;

        foreach (var allocation in allocations)
        {
            var item = await Set<Item>()
                .Include(i => i.Meta)
                .Active()
                .FirstOrDefaultAsync(i =>
                    i.Id == allocation.ItemId &&
                    i.OrderId == orderId &&
                    i.ProcessId != null);

            if (item == null)
            {
                errors.Add($"Output item {allocation.ItemId} not found or not owned by the order.");
                continue;
            }

            var tare = await Set<Tare>().AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == allocation.TareId);

            if (tare == null)
            {
                errors.Add($"Tare {allocation.TareId} not found.");
                continue;
            }

            item.TareId = allocation.TareId;
            item.Address = allocation.Address;
            allocated++;
        }

        await Db.SaveChangesAsync();

        if (allocated > 0)
        {
            PublishOrderEvent(LogisticsEventKinds.OrderOutputsAllocated, orderId);
        }

        return new AllocateOutputsResult
        {
            AllocatedCount = allocated,
            Errors = errors.ToArray(),
        };
    }

    public async Task<AssignGradesResult> AssignGrades(Guid orderId, AssignGradesRequest request)
    {
        var errors = new List<string>();

        if (request.ItemIds.Length == 0)
        {
            return new AssignGradesResult { UpdatedCount = 0, Errors = [] };
        }

        var order = await Set()
            .Include(o => o.Meta)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new EdmException($"Order with id {orderId} not found");
        AssertCanMutate(order);

        if (request.GradeId != null)
        {
            var gradeBelongs = await Set<Grade>().AsNoTracking()
                .AnyAsync(g => g.Id == request.GradeId && g.ProcessId == order.ProcessId);
            if (!gradeBelongs)
            {
                throw new EdmException(
                    $"Grade {request.GradeId} does not belong to the order's process.");
            }
        }

        var items = await Set<Item>()
            .Include(i => i.Meta)
            .Active()
            .Where(i =>
                request.ItemIds.Contains(i.Id) &&
                i.OrderId == orderId &&
                i.ProcessId != null)
            .ToListAsync();

        var foundIds = new HashSet<Guid>(items.Select(i => i.Id));
        foreach (var missing in request.ItemIds.Where(id => !foundIds.Contains(id)))
        {
            errors.Add($"Output item {missing} not found or not owned by the order.");
        }

        var updated = 0;
        foreach (var item in items)
        {
            if (item.TareId != null)
            {
                errors.Add($"Item {item.Id} is already allocated to a tare; grade is locked.");
                continue;
            }
            item.GradeId = request.GradeId;
            updated++;
        }

        if (updated > 0)
        {
            await Db.SaveChangesAsync();
            PublishOrderEvent(LogisticsEventKinds.OrderGradesAssigned, orderId);
        }

        return new AssignGradesResult
        {
            UpdatedCount = updated,
            Errors = errors.ToArray(),
        };
    }

    public async Task CompleteOrder(Guid orderId)
    {
        var order = await Set()
            .Include(o => o.Meta)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new EdmException($"Order with id {orderId} not found");
        AssertCanMutate(order);

        if (order.Meta.Completed != null)
        {
            throw new EdmException("Order is already completed.");
        }

        var hasPending = await Set<Item>().AsNoTracking()
            .Include(i => i.Meta)
            .Active()
            .AnyAsync(i =>
                i.OrderId == orderId &&
                i.ProcessId != null &&
                i.TareId == null);

        if (hasPending)
        {
            throw new EdmException("Cannot complete the order: some outputs are still unallocated.");
        }

        order.Meta.Completed = DateTime.UtcNow;
        await Db.SaveChangesAsync();

        PublishOrderEvent(LogisticsEventKinds.OrderCompleted, orderId);
    }

    /// <summary>
    /// Kept for the future integration phase when operations within a technology
    /// process will contribute their own grade to outputs. Not called from
    /// <see cref="Save"/> or <see cref="Execute"/> today.
    /// </summary>
    private async Task<IEnumerable<Guid>> GetOperationProcesses(Process process)
    {
        var result = new List<Guid>();
        var subs = await Set<SubProcess>().AsNoTracking()
            .Include(p => p.Process.SubProcesses)
            .Where(p => p.ProcessId == process.Id)
            .OrderBy(p => p.Order)
            .Select(p => p.LinkedProcess)
            .ToListAsync();
        if (process.Kind == ProcessKinds.Operation)
        {
            result.Add(process.Id);
        }

        foreach (var linked in subs)
        {
            result.AddRange(await GetOperationProcesses(linked));
        }

        return result;
    }

    public async Task<IEnumerable<Order>> Search(OrderSearchQuery query)
    {
        // TODO Use materialized view to gain performance.
        // Active: no Deleted AND no Completed. Completed view: Completed != null AND Deleted == null.
        var baseQuery = Set().AsNoTracking()
            .Include(o => o.Process.Nomenclature).ThenInclude(n => n.DefaultTareType)
            .Include(o => o.Meta);
        var lifecycleScoped = query.Active
            ? baseQuery.Active()
            : baseQuery.Where(i => i.Meta.Deleted == null && i.Meta.Completed != null);
        var orders = await lifecycleScoped
            .Where(i => query.NomenclatureId == null || query.NomenclatureId == i.Process.NomenclatureId)
            .ToListAsync();

        return orders;
    }

    /// <summary>
    /// Returns per-order view-model annotations derived from execution state:
    /// <c>Status</c>, <c>Executor</c>, and <c>Mine</c>. Used by controllers to
    /// enrich the mapped <see cref="OrderViewModel"/>s with state the
    /// AutoMapper profile cannot produce on its own (Mine depends on the
    /// current user).
    /// </summary>
    public async Task<IReadOnlyDictionary<Guid, OrderExecutionState>> GetExecutionStates(IEnumerable<Guid> orderIds)
    {
        var ids = orderIds.ToArray();
        if (ids.Length == 0)
        {
            return new Dictionary<Guid, OrderExecutionState>();
        }

        var orderProcesses = await Set<OrderProcess>().AsNoTracking()
            .Where(op => ids.Contains(op.OrderId))
            .GroupBy(op => op.OrderId)
            .Select(g => new
            {
                OrderId = g.Key,
                StartTime = g.Min(op => op.StartTime),
            })
            .ToListAsync();
        var startByOrder = orderProcesses.ToDictionary(x => x.OrderId, x => x.StartTime);

        // Pending output = output item (ProcessId != null) without a tare,
        // not deleted/completed.
        var pendingByOrder = await Set<Item>().AsNoTracking()
            .Include(i => i.Meta)
            .Active()
            .Where(i =>
                i.OrderId != null && ids.Contains(i.OrderId.Value) &&
                i.ProcessId != null && i.TareId == null)
            .GroupBy(i => i.OrderId!.Value)
            .Select(g => new { OrderId = g.Key, Count = g.Count() })
            .ToListAsync();
        var pendingCounts = pendingByOrder.ToDictionary(x => x.OrderId, x => x.Count);

        var metas = await Set<Order>().AsNoTracking()
            .Include(o => o.Meta)
            .Where(o => ids.Contains(o.Id))
            .Select(o => new { o.Id, Completed = o.Meta.Completed, Executor = o.Meta.Executor })
            .ToListAsync();

        var currentUser = UserService.GetUserName();
        var result = new Dictionary<Guid, OrderExecutionState>();
        foreach (var m in metas)
        {
            startByOrder.TryGetValue(m.Id, out var start);
            pendingCounts.TryGetValue(m.Id, out var pending);
            result[m.Id] = new OrderExecutionState
            {
                Status = DeriveStatus(m.Completed, start, pending),
                Executor = m.Executor,
                Mine = !string.IsNullOrEmpty(m.Executor) &&
                       string.Equals(m.Executor, currentUser, StringComparison.OrdinalIgnoreCase),
            };
        }
        return result;
    }

    // Latest = most recently created order whose Number is set, regardless of
    // whether the order is completed or soft-deleted — completed/cancelled
    // numbers are still "used" and must not be reissued. Rows with an empty
    // Number (migration default or pre-feature data) are skipped so the
    // sequence never rolls back to "1" once any numbered order exists.
    // Concurrent /next-number calls can race and produce duplicates; accepted
    // per product decision (Number is a free-form identifier the user can
    // override, no DB unique constraint).
    public async Task<string> GetNextNumber()
    {
        var latest = await Set().AsNoTracking()
            .Include(o => o.Meta)
            .Where(o => o.Number != "")
            .OrderByDescending(o => o.Meta.Created)
            .Select(o => o.Number)
            .FirstOrDefaultAsync();
        return OrderNumberHelper.GenerateNext(latest);
    }
}

public class OrderExecutionState
{
    public OrderStatus Status { get; set; }
    public string? Executor { get; set; }
    public bool Mine { get; set; }
}
