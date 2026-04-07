using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface ISupplyService : IGenericService<Supply>
{
    Task<IEnumerable<Item>> GetItems(Guid supplyId);
    Task<Item> AddItem(Guid supplyId, Item item);
    Task UnlinkItem(Guid supplyId, Guid itemId);
}

