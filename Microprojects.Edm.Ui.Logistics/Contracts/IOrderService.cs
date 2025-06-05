using System;
using System.Collections.Generic;
using System.Text;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface IOrderService : IGenericService<Order>
{
    Task<IEnumerable<Item>> GetItems(Guid id);
    Task<IEnumerable<OrderSpecificationNomenclature>> GetSpecifications(Guid id, Guid? processId = null);
    Task<IEnumerable<OrderProcess>> GetOrderProcesses(Guid id, bool asNoTracking = true);
    Task<Item> AddItem(Guid id, Item item);
    Task<bool> Execute(Guid id, Guid? processId);
    Task<IEnumerable<Order>> Search(OrderSearchQuery query);
}
