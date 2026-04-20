using System;
using System.Linq.Expressions;
using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class OrderService : ServiceBase<Order>, IOrderService
{
    private const double Eps = 1e-9;

    private IItemService _itemService;
    private IMapper? _mapper;

    public OrderService()
    {
    }

    public OrderService(LogisticsContext db, IUserService userService, IItemService itemService, IMapper mapper) : base(db, userService)
    {
        _itemService = itemService;
        _mapper = mapper;
    }

    public override async Task<Order> Get(Guid id)
    {
        var order = await Set().AsNoTracking()
            .Include(o => o.Process.Nomenclature)
            .Include(o => o.Meta)
            .FirstOrDefaultAsync(o => o.Id == id);
        return order;
    }

    public override async Task<IEnumerable<Order>> GetAll(Expression<Func<Order, bool>>? predicate = null)
    {
        var query = Set().AsNoTracking()
            .Include(i => i.Process.Nomenclature)
            .Include(e => e.Meta)
            .Where(e => e.Meta.Deleted == null && e.Meta.Completed == null);

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        return await query.ToListAsync();
    }

    public override async Task<Order> Save(Order order)
    {
        var create = order.Id == Guid.Empty;
        // Avoid creating a new process
        order.Process = null;
        await base.Save(order);
        if (create)
        {
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
        var items = await Set<Item>().AsNoTracking()
            .Include(i => i.Meta)
            .Where(i => i.OrderId == orderId && i.Meta.Deleted == null && i.Meta.Completed == null)
            .ToListAsync();
        var rows = await Set<SpecificationNomenclature>().AsNoTracking()
            .Include(sn => sn.Nomenclature)
            .Include(sn => sn.Specification.Process)
            .Where(sn => specifications.Select(s => s.Id).Contains(sn.SpecificationId))
            .ToListAsync();
        var result = rows
            .GroupBy(r => r.NomenclatureId, (key, list) => new OrderSpecificationNomenclature
            {
                Order = order,
                Nomenclature = list.First().Nomenclature,
                Quantity = list.Sum(s => s.Quantity),
                Items = items.Where(i => i.NomenclatureId == key).ToList()
            });

        return result;
    }

    public async Task<IEnumerable<Item>> GetItems(Guid id)
    {
        var items = await Set<Item>().AsNoTracking()
            .Include(i => i.Nomenclature)
            .Include(i => i.Tare.TareType)
            .Include(i => i.Meta)
            .Where(i => i.OrderId == id && i.Meta.Deleted == null && i.Meta.Completed == null)
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

    public async Task<Item> AddItem(Guid id, Item item)
    {
        var specification = (await GetSpecifications(id))
                            .FirstOrDefault(s => s.NomenclatureId == item.NomenclatureId)
                            ?? throw new EdmException(
                                $"Specification for nomenclature {item.NomenclatureId} not found");
        if (specification.Total >= specification.Amount)
        {
            throw new EdmException($"{specification.Nomenclature.Name} no more required");
        }

        var storeItem = await Set<Item>()
                            .FirstOrDefaultAsync(i => i.Id == item.Id)
                        ?? throw new EdmException($"Item with id {item.Id} not found");
        var tare = storeItem.Tare;
        var requiredAmount = specification.Amount - specification.Total;
        if (storeItem.Quantity <= requiredAmount)
        {
            storeItem.OrderId = id;
            await Db.SaveChangesAsync();
        }
        else
        {
            var splitQty = Math.Min(storeItem.Quantity, requiredAmount);
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
            }
            catch (EdmException ex)
            {
                stoppedReason = ex.Message;
                break;
            }
        }

        return new AllocateItemsResult
        {
            AllocatedCount = allocated,
            AllocatedQuantity = totalQty,
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
                .Where(i =>
                    i.OrderId == order.Id &&
                    i.NomenclatureId == spec.NomenclatureId &&
                    i.Meta.Deleted == null &&
                    i.Meta.Completed == null)
                .OrderBy(i => i.Id) // UUIDv7 ordering: FIFO by creation time
                .ToListAsync();

            if (targetOutputItems.Count == 0)
            {
                // No output items -> consume the required quantity without persisting links.
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
                    var consumed = Math.Min(item.Quantity, remaining);
                    item.Quantity -= consumed;
                    remaining -= consumed;
                    if (item.Quantity <= Eps)
                    {
                        item.Quantity = 0;
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

                    var available = inputItem.Quantity;
                    if (available <= Eps)
                    {
                        inputItem.Meta.Completed = now;
                        inputItem.Quantity = 0;
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

                    inputItem.Quantity -= consumed;
                    requiredForThisTarget -= consumed;

                    if (inputItem.Quantity <= Eps)
                    {
                        inputItem.Quantity = 0;
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

        return new ExecuteResult
        {
            Completed = pendingCount == 0,
            PendingCount = pendingCount,
        };
    }

    public async Task<OrderOutputItems> GetOutputItems(Guid orderId)
    {
        var items = await Set<Item>().AsNoTracking()
            .Include(i => i.Nomenclature)
            .Include(i => i.Tare).ThenInclude(t => t.TareType)
            .Include(i => i.Meta)
            .Where(i =>
                i.OrderId == orderId &&
                i.ProcessId != null &&
                i.Meta.Deleted == null &&
                i.Meta.Completed == null)
            .ToListAsync();

        var allocated = items.Where(i => i.TareId != null).ToList();
        var unallocated = items.Where(i => i.TareId == null).ToList();

        return new OrderOutputItems
        {
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
        var errors = new List<string>();
        var allocated = 0;

        foreach (var allocation in allocations)
        {
            var item = await Set<Item>()
                .Include(i => i.Meta)
                .FirstOrDefaultAsync(i =>
                    i.Id == allocation.ItemId &&
                    i.OrderId == orderId &&
                    i.ProcessId != null &&
                    i.Meta.Deleted == null &&
                    i.Meta.Completed == null);

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

        return new AllocateOutputsResult
        {
            AllocatedCount = allocated,
            Errors = errors.ToArray(),
        };
    }

    public async Task CompleteOrder(Guid orderId)
    {
        var order = await Set()
            .Include(o => o.Meta)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new EdmException($"Order with id {orderId} not found");

        if (order.Meta.Completed != null)
        {
            throw new EdmException("Order is already completed.");
        }

        var hasPending = await Set<Item>().AsNoTracking()
            .Include(i => i.Meta)
            .AnyAsync(i =>
                i.OrderId == orderId &&
                i.ProcessId != null &&
                i.TareId == null &&
                i.Meta.Deleted == null &&
                i.Meta.Completed == null);

        if (hasPending)
        {
            throw new EdmException("Cannot complete the order: some outputs are still unallocated.");
        }

        order.Meta.Completed = DateTime.UtcNow;
        await Db.SaveChangesAsync();
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
        var orders = await Set().AsNoTracking()
            .Include(o => o.Process.Nomenclature)
            .Include(o => o.Meta)
            .Where(i =>
                (query.Active
                    ? (i.Meta.Deleted == null && i.Meta.Completed == null)
                    : (i.Meta.Deleted == null && i.Meta.Completed != null))
                && (query.NomenclatureId == null || query.NomenclatureId == i.Process.NomenclatureId))
            .ToListAsync();

        return orders;
    }
}
