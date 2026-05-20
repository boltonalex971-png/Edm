using System;
using System.Collections.Generic;
using System.Linq;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Plugins;

namespace Microprojects.Edm.Ui.Logistics.Utils;

/// <summary>
/// Single home for the tare/address/countable rules that recur across
/// <c>ItemService.Save</c>, <c>BatchCreate</c>, <c>Repack</c>, and
/// <c>TaresController.GetAvailable</c>. Note: <c>OrderService.Execute</c>
/// intentionally bypasses the integer rule — it consumes by ratio and does
/// not reshape tare contents, see <c>OrderService.Execute</c> for the
/// rationale.
/// </summary>
public static class TareRules
{
    public const double Eps = 1e-9;

    /// <summary>True when the tare type carries addressed slots.</summary>
    public static bool IsAddressed(TareType type) => type.Dimensions > 0;

    /// <summary>
    /// True when the tare counts pieces but has no addressed slots —
    /// e.g. a counted-by-the-piece bin. Quantities placed into such tares
    /// must be integers.
    /// </summary>
    public static bool IsCountableBulk(TareType type) =>
        type.Countable && type.Dimensions <= 0;

    /// <summary>
    /// Capacity already consumed by the supplied items. For addressed
    /// countable tares, capacity is measured in slot count; for everything
    /// else, in summed quantity. When <paramref name="available"/> is
    /// supplied, items found in the dict contribute their available
    /// quantity (i.e. <see cref="Item.Quantity"/> minus non-execution
    /// outgoing splits) instead of raw <see cref="Item.Quantity"/> — needed
    /// because Repack no longer decrements the parent on bulk splits.
    /// </summary>
    public static double UsedCapacity(
        TareType type,
        IEnumerable<Item> items,
        IReadOnlyDictionary<Guid, double>? available = null)
    {
        if (type.Countable && type.Dimensions > 0)
        {
            return items.Count();
        }
        return items.Sum(i =>
            available != null && available.TryGetValue(i.Id, out var a) ? a : i.Quantity);
    }

    /// <summary>
    /// Throws if <paramref name="quantity"/> is not an integer (within
    /// <see cref="Eps"/>). Used for countable bulk tares — addressed
    /// countable tares allocate per slot so the rule reduces to "1 per add".
    /// </summary>
    public static void EnsureIntegerQuantity(double quantity, string context)
    {
        var rounded = Math.Round(quantity);
        if (Math.Abs(quantity - rounded) > Eps)
        {
            throw new EdmException(
                "Logistics.Tare.QuantityMustBeInteger",
                new Dictionary<string, object> { ["context"] = context },
                $"Quantity must be an integer for {context}.");
        }
    }
}
