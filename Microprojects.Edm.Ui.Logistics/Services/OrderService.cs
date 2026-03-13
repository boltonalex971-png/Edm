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
            .Where(i => i.OrderId == orderId)
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
        var processes = (await GetOrderProcesses(id, asNoTracking: false)) //order.Processes
            .Where(p => p.StartTime == null)
            .OrderBy(p => p.Ordering);
        foreach (var process in processes)
        {
            var specification = (await GetSpecifications(id, process.ProcessId))
                .ToList();
            // Check if all required components for the process are allocated
            if (specification.Any(n => n.Total < n.Amount))
                throw new EdmException("Not all required components are available");

            // Set operation started 
            process.StartTime = DateTime.UtcNow;
            if (process.Process.NomenclatureId != null)
            {
                // Create new output item
                // TODO Operation can be
                //      bulk-to-bulk: takes all income items and convert them to single large outcome item (the same op-parameters for all)
                //      bulk-to-many: takes all income and shards it to many one-pcs items (splitting smth to pieces)
                //      many-to-many: take at least one one-pcs nomenclature item and convert it to one-pcs output item
                //          m-2-m operation is usually is one piece operation (e.g., measuring parameters of a single component)
                // WARNING at the moment only bulk-to-bulk implemented
                var outputItem = await _itemService.Save(new Item
                {
                    NomenclatureId = process.Process.NomenclatureId!.Value,
                    OrderId = id,
                    ProcessId = process.ProcessId,
                    Quantity = order.Amount,
                    Tare = new Tare
                    {
                        TareTypeId = process.Process.Nomenclature!.DefaultTareTypeId!.Value,
                        Barcode = $"{id}"
                    }
                });
            }

            // Archive specification items
            foreach (var specItem in specification)
            {
                var items = await Set<Item>()
                    .Include(i => i.Meta)
                    .Where(i => i.OrderId == order.Id && i.NomenclatureId == specItem.NomenclatureId &&
                                i.Meta.Deleted == null)
                    .OrderBy(i => i.Meta.Created)
                    .ToListAsync();
                double total = 0;
                foreach (var item in items)
                {
                    // TODO split item if it is not fully consumed
                    total += item.Quantity;
                    item.Meta.Deleted = DateTime.UtcNow;
                    if (total >= specItem.Amount)
                        break;
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