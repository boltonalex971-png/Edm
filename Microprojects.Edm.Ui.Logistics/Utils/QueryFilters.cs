using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Logistics.Utils;

public static class QueryFilters
{
    /// <summary>
    /// Active = not soft-deleted and not naturally completed. The canonical
    /// "live row" filter for IWithMeta entities. Reused everywhere the
    /// service layer needs to ignore tombstoned rows.
    /// </summary>
    public static IQueryable<T> Active<T>(this IQueryable<T> source) where T : class, IWithMeta =>
        source.Where(e => e.Meta.Deleted == null && e.Meta.Completed == null);

    /// <summary>
    /// Inverse of <see cref="Active{T}"/>: completed XOR deleted, no live rows.
    /// </summary>
    public static IQueryable<T> Inactive<T>(this IQueryable<T> source) where T : class, IWithMeta =>
        source.Where(e => e.Meta.Deleted != null || e.Meta.Completed != null);

    /// <summary>
    /// Soft-deleted rows excluded, but naturally-completed rows (consumed
    /// items, finished orders) kept. The right filter for historical views
    /// where lifecycle artefacts must remain visible.
    /// </summary>
    public static IQueryable<T> NotDeleted<T>(this IQueryable<T> source) where T : class, IWithMeta =>
        source.Where(e => e.Meta.Deleted == null);
}

/// <summary>
/// Single producer of the <see cref="ItemViewModel.IsStore"/> flag. Items
/// are "store" when they were created via batch entry: no supply, no
/// producing process, no parent <see cref="ItemLink"/>. Controllers call
/// <see cref="Apply"/> after AutoMapper to populate the flag in one batched
/// query, replacing the three divergent inline implementations the service
/// layer used to carry.
/// </summary>
public static class ItemFlags
{
    public static async Task Apply(LogisticsContext db, IEnumerable<ItemViewModel> dtos)
    {
        var list = dtos as ICollection<ItemViewModel> ?? dtos.ToList();
        var candidates = list
            .Where(d => d.SupplyId == null && !d.IsOutput)
            .Select(d => d.Id)
            .ToList();
        if (candidates.Count == 0)
        {
            return;
        }

        var withParent = await db.ItemLinks.AsNoTracking()
            .Where(l => candidates.Contains(l.TargetItemId))
            .Select(l => l.TargetItemId)
            .Distinct()
            .ToListAsync();
        var withParentSet = withParent.ToHashSet();

        foreach (var d in list)
        {
            d.IsStore = d.SupplyId == null
                && !d.IsOutput
                && !withParentSet.Contains(d.Id);
        }
    }

    public static Task Apply(LogisticsContext db, ItemViewModel dto) =>
        Apply(db, [dto]);
}

/// <summary>
/// "Available" view: an item's <see cref="Item.Quantity"/> minus the sum of
/// every outgoing <see cref="ItemLink.ConsumedQuantity"/> — both
/// non-execution (allocation / repack splits) and execution (Order Execute
/// consumption). Under the immutable-Quantity model, links are the sole
/// record of consumption; <c>Item.Quantity</c> is fixed at creation and
/// represents the original allocation/production amount. Use this for any
/// "what's left" read (capacity, allocation, repack, post-execution
/// availability). Pure read — no mutation.
/// </summary>
public static class ItemHistory
{
    public static async Task<IReadOnlyDictionary<Guid, double>> GetAvailableQuantities(
        LogisticsContext db, IEnumerable<Item> items)
    {
        var byId = items.ToDictionary(i => i.Id, i => i.Quantity);
        if (byId.Count == 0)
        {
            return byId;
        }
        var ids = byId.Keys.ToList();
        var splits = (await db.ItemLinks.AsNoTracking()
                .Where(l => ids.Contains(l.SourceItemId))
                .GroupBy(l => l.SourceItemId)
                .Select(g => new { Id = g.Key, Sum = g.Sum(l => l.ConsumedQuantity) })
                .ToListAsync())
            .ToDictionary(x => x.Id, x => x.Sum);
        return byId.ToDictionary(
            kv => kv.Key,
            kv => kv.Value - splits.GetValueOrDefault(kv.Key, 0));
    }

    public static async Task<double> GetAvailableQuantity(LogisticsContext db, Item item)
    {
        var split = await db.ItemLinks.AsNoTracking()
            .Where(l => l.SourceItemId == item.Id)
            .SumAsync(l => (double?)l.ConsumedQuantity) ?? 0;
        return item.Quantity - split;
    }
}
