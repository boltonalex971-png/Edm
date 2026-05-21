using System;
using System.Collections.Generic;
using Microprojects.Edm.Ui.Logistics.Models;
using Directory = Microprojects.Edm.Domain.Directory;

namespace Microprojects.Edm.Ui.Logistics.Events;

// Maps Logistics CLR entity types to the client-side tag taxonomy used
// by useEntityToken/useInvalidateEntities. Returns an empty array for
// entities the UI doesn't subscribe to (e.g. Changelog, Meta,
// Assignment) — the publishing interceptor skips those. Many-to-many
// link entities return both endpoint tags so listeners on either side
// refresh.
internal static class EntityTypeTag
{
    public static IReadOnlyList<string> For(Type t)
    {
        if (t == typeof(Nomenclature)) return [LogisticsEntityTypes.Nomenclature];
        if (t == typeof(Process)) return [LogisticsEntityTypes.Process];
        if (t == typeof(SubProcess)) return [LogisticsEntityTypes.Process];
        if (t == typeof(Grade)) return [LogisticsEntityTypes.Process];
        if (t == typeof(TareType)) return [LogisticsEntityTypes.TareType];
        if (t == typeof(Order)) return [LogisticsEntityTypes.Order];
        if (t == typeof(OrderProcess)) return [LogisticsEntityTypes.Order];
        if (t == typeof(Item)) return [LogisticsEntityTypes.Item];
        if (t == typeof(ItemLink)) return [LogisticsEntityTypes.Item];
        if (t == typeof(Tare)) return [LogisticsEntityTypes.Tare];
        if (t == typeof(Supply)) return [LogisticsEntityTypes.Supply];
        if (t == typeof(Directory)) return [LogisticsEntityTypes.Directory];
        if (t == typeof(Specification)) return [LogisticsEntityTypes.Process];
        if (t == typeof(SpecificationNomenclature)) return [LogisticsEntityTypes.Process];
        // Many-to-many — emit one tag per side so detail panels for either
        // nomenclature or taretype refresh.
        if (t == typeof(NomenclatureTareType))
        {
            return [LogisticsEntityTypes.Nomenclature, LogisticsEntityTypes.TareType];
        }
        return [];
    }
}
