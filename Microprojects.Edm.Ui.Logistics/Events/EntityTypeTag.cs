using System;
using Microprojects.Edm.Ui.Logistics.Models;
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.Events;

// Maps Logistics CLR entity types to the client-side tag taxonomy used
// by useEntityToken/useInvalidateEntities. Returns null for entities the
// UI doesn't subscribe to (e.g. Changelog, Meta, Assignment) — the
// publishing interceptor skips those.
internal static class EntityTypeTag
{
    public static string? For(Type t)
    {
        if (t == typeof(Nomenclature)) return "nomenclature";
        if (t == typeof(Process)) return "process";
        if (t == typeof(SubProcess)) return "process";
        if (t == typeof(Grade)) return "process";
        if (t == typeof(TareType)) return "taretype";
        if (t == typeof(Order)) return "order";
        if (t == typeof(OrderProcess)) return "order";
        if (t == typeof(Item)) return "item";
        if (t == typeof(ItemLink)) return "item";
        if (t == typeof(Tare)) return "tare";
        if (t == typeof(Supply)) return "supply";
        if (t == typeof(Directory)) return "directory";
        if (t == typeof(Specification)) return "process";
        if (t == typeof(SpecificationNomenclature)) return "process";
        // Many-to-many — handled specially by the interceptor so both sides
        // (Nomenclature and TareType) get invalidated.
        if (t == typeof(NomenclatureTareType)) return "nomenclature+taretype";
        return null;
    }
}
