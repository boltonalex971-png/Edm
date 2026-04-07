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
    private IItemService _itemService;

    public OrderService()
    {
    }

    public OrderService(LogisticsContext db, IUserService userService, IItemService itemService) : base(db, userService)
    {
        _itemService = itemService;
    }

    public override async Task<Order> Get(Guid id)
    {
        var order = await Set().AsNoTracking()
            .Include(o => o.Process.Nomenclature)
            .FirstOrDefaultAsync(o => o.Id == id);
        return order;
    }

    public override async Task<IEnumerable<Order>> GetAll(Expression<Func<Order, bool>>? predicate = null)
    {
        var query = Set().AsNoTracking()
            .Include(i => i.Process.Nomenclature)
            .Include(e => e.Meta)
            .Where(e => e.Meta.Deleted == null);

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
            var process = await Set<Process>().FirstAsync(p => p.Id == order.ProcessId);
            var processes = await GetOperationProcesses(process);
            Db.AddRange(
                processes
                    .Select((p, i) => new OrderProcess
                        {
                            Id = DomainObject.NewGuid(),
                            OrderId = order.Id,
                            ProcessId = p,
                            Ordering = (i + 1) * 10
                        }
                    )
            );
            await Db.SaveChangesAsync();
        }

        return order;
    }

    public async Task<IEnumerable<OrderSpecificationNomenclature>> GetSpecifications(Guid orderId,
        Guid? processId = null)
    {
        var order = await Get(orderId);
        var specifications = await Set<OrderProcess>().AsNoTracking()
            .Include(p => p.Process.Specifications
                .Where(s => s.Active))
            .Where(p => p.OrderId == orderId && (processId == null || p.ProcessId == processId))
            .SelectMany(p => p.Process.Specifications)
            .ToListAsync();
        var items = await Set<Item>().AsNoTracking()
            .Include(i => i.Meta)
            .Where(i => i.OrderId == orderId && i.Meta.Deleted == null)
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
            .Where(i => i.OrderId == id && i.Meta.Deleted == null)
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
            storeItem = await _itemService.Save(new Item
            {
                OrderId = id,
                OriginId = storeItem.Id,
                NomenclatureId = storeItem.NomenclatureId,
                Quantity = Math.Min(storeItem.Quantity, requiredAmount),
                TareId = storeItem.TareId
            });
            storeItem.Tare = tare;
        }

        return storeItem;
    }

    public async Task<bool> Execute(Guid id, Guid? processId)
    {
        var order = await Set()
            .Include(o => o.Meta)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            throw new EdmException($"Order with id {id} not found");
        }

        IEnumerable<OrderProcess> processesQuery = (await GetOrderProcesses(id, asNoTracking: false))
            .Where(p => p.StartTime == null)
            .OrderBy(p => p.Ordering);

        if (processId != null)
        {
            processesQuery = processesQuery.Where(p => p.ProcessId == processId);
        }

        var eps = 1e-9;

        foreach (var process in processesQuery)
        {
            var specifications = (await GetSpecifications(id, process.ProcessId))
                .ToList();

            // Check if all required components for the process are allocated
            if (specifications.Any(n => n.Total + eps < n.Amount))
                throw new EdmException("Not all required components are available");

            // Set operation started
            process.StartTime = DateTime.UtcNow;

            var targetOutputItems = new List<Item>();
            if (process.Process.NomenclatureId != null)
            {
                var targetNomenclature = process.Process.Nomenclature
                                         ?? await Set<Nomenclature>()
                                             .AsNoTracking()
                                             .FirstAsync(n => n.Id == process.Process.NomenclatureId.Value);

                if (targetNomenclature.Countable)
                {
                    var rounded = Math.Round(order.Amount);
                    if (Math.Abs(order.Amount - rounded) > eps)
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
                            ProcessId = process.ProcessId,
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
                        ProcessId = process.ProcessId,
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
                        i.Meta.Deleted == null)
                    .OrderBy(i => i.Id) // UUIDv7 ordering: FIFO by creation time
                    .ToListAsync();

                if (targetOutputItems.Count == 0)
                {
                    // No output items -> consume the required quantity without persisting links.
                    var remaining = spec.Amount;
                    foreach (var item in inputItems)
                    {
                        if (remaining <= eps)
                            break;

                        var consumed = Math.Min(item.Quantity, remaining);
                        item.Quantity -= consumed;
                        remaining -= consumed;
                        if (item.Quantity <= eps)
                        {
                            item.Quantity = 0;
                            item.Meta.Deleted = DateTime.UtcNow;
                        }
                    }

                    if (remaining > eps)
                    {
                        throw new EdmException("Not enough input quantity to consume.");
                    }

                    continue;
                }

                var inputIndex = 0;
                foreach (var targetItem in targetOutputItems)
                {
                    var requiredForThisTarget = spec.Quantity * targetItem.Quantity;
                    while (requiredForThisTarget > eps)
                    {
                        if (inputIndex >= inputItems.Count)
                        {
                            throw new EdmException("Not enough input quantity to allocate required output.");
                        }

                        var inputItem = inputItems[inputIndex];

                        var available = inputItem.Quantity;
                        if (available <= eps)
                        {
                            inputItem.Meta.Deleted = DateTime.UtcNow;
                            inputItem.Quantity = 0;
                            inputIndex++;
                            continue;
                        }

                        var consumed = Math.Min(available, requiredForThisTarget);

                        Db.ItemLinks.Add(new ItemLink
                        {
                            Id = DomainObject.NewGuid(),
                            OrderProcessId = process.Id,
                            SourceItemId = inputItem.Id,
                            TargetItemId = targetItem.Id,
                            ConsumedQuantity = consumed
                        });

                        inputItem.Quantity -= consumed;
                        requiredForThisTarget -= consumed;

                        if (inputItem.Quantity <= eps)
                        {
                            inputItem.Quantity = 0;
                            inputItem.Meta.Deleted = DateTime.UtcNow;
                            inputIndex++;
                        }
                    }
                }
            }

            // Set operation completed
            process.EndTime = DateTime.UtcNow;
            await Db.SaveChangesAsync();
        }

        // Complete order
        order.Meta.Deleted = DateTime.UtcNow;
        await Db.SaveChangesAsync();

        return true;
    }

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
        // TODO Use materialized view to gain performance
        var orders = await Set().AsNoTracking()
            .Include(o => o.Process.Nomenclature)
            .Include(o => o.Meta)
            .Where(i => (query.Active && i.Meta.Deleted == null || !query.Active && i.Meta.Deleted != null)
                        && (query.NomenclatureId == null || query.NomenclatureId == i.Process.NomenclatureId))
            .ToListAsync();

        return orders;
    }
}