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
    Task<AllocateItemsResult> AddItems(Guid orderId, IEnumerable<Guid> itemIds);
    Task<ExecuteResult> Execute(Guid id);
    Task<OrderOutputItems> GetOutputItems(Guid orderId);
    Task<AllocateOutputsResult> AllocateOutputs(Guid orderId, IEnumerable<OutputAllocation> allocations);
    Task<AssignGradesResult> AssignGrades(Guid orderId, AssignGradesRequest request);
    Task CompleteOrder(Guid orderId);
    Task<IEnumerable<Order>> Search(OrderSearchQuery query);
    Task<IReadOnlyDictionary<Guid, Services.OrderExecutionState>> GetExecutionStates(IEnumerable<Guid> orderIds);
}
