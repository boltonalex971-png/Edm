using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class OrderService : ServiceBase<Order>, IOrderService
{
    public OrderService()
    {
    }

    public OrderService(LogisticsContext db, IUserService userService) : base(db, userService)
    {
    }

    public override async Task<Order> Get(Guid id)
    {
        var order = await Set().AsNoTracking()
            .Include(o => o.Process.Nomenclature)
            .FirstOrDefaultAsync(o => o.Id == id);
        return order;
    }

    public override async Task<IEnumerable<Order>> GetAll()
    {
        var query = Set().AsNoTracking();
        var result = await query
            .Include(i => i.Process.Nomenclature)
            .Include(e => e.Meta)
            .Where(e => e.Meta.Deleted == null)
            .ToListAsync();

        return result;
    }

    public override async Task<Order> Save(Order order)
    {
        // Avoid creating a new process
        order.Process = null;
        await base.Save(order);
        var processes = await GetOperationProcesses(order.ProcessId);
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

        return order;
    }

    public async Task<IEnumerable<OrderSpecificationNomenclature>> GetSpecifications(Guid id)
    {
        var order = await Get(id);
        var specifications = await Set<OrderProcess>().AsNoTracking()
            .Include(p => p.Process.Specifications.Where(s => s.Active))
            .Where(p => p.OrderId == id)
            .SelectMany(p => p.Process.Specifications)
            .ToListAsync();
        var items = await Set<Item>().AsNoTracking()
            .Where(i => i.OrderId == id)
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
            .Where(i => i.OrderId == id)
            .ToListAsync();

        return items;
    }

    public async Task<IEnumerable<OrderProcess>> GetOrderProcesses(Guid id)
    {
        var operations = await Set<OrderProcess>().AsNoTracking()
            .Include(op => op.Process.Nomenclature)
            .Where(i => i.OrderId == id)
            .OrderBy(op => op.Ordering)
            .ToListAsync();

        return operations;
    }

    private async Task<IEnumerable<Guid>> GetOperationProcesses(Guid id)
    {
        var result = new List<Guid>();
        var subs = await Set<SubProcess>().AsNoTracking()
            .Include(p => p.Process.SubProcesses)
            .Where(p => p.ProcessId == id)
            .OrderBy(p => p.Order)
            .Select(p => p.LinkedProcessId)
            .ToListAsync();
        result.Add(id);
        foreach (var processId in subs)
        {
            result.AddRange(await GetOperationProcesses(processId));
        }

        return result;
    }
}