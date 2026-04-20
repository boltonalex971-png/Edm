using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface IItemService : IGenericService<Item>
{
    Task<IEnumerable<Item>> Search(ItemSearchQuery parameters);
    Task<ItemGenealogy> GetGenealogy(Guid rootItemId, int depth);
    Task<RepackResult> Repack(RepackRequest request);
    Task<IEnumerable<Item>> GetByTare(Guid tareId);
    Task<BatchCreateItemResult> BatchCreate(BatchCreateItemRequest request);
}
