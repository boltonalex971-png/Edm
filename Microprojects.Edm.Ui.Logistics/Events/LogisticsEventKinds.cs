namespace Microprojects.Edm.Ui.Logistics.Events;

// String constants for the LogisticsMessage.Kind discriminator. Keep in
// sync with EventKind in Ui/src/hooks/logisticsEvents.ts — the contract
// is the wire format, so both sides must agree on the literal values.
public static class LogisticsEventKinds
{
    public const string EntityChanged = "entity.changed";
    public const string EntityLocked = "entity.locked";
    public const string EntityUnlocked = "entity.unlocked";

    public const string OrderExecuted = "order.executed";
    public const string OrderCompleted = "order.completed";
    public const string OrderOutputsAllocated = "order.outputs-allocated";
    public const string OrderGradesAssigned = "order.grades-assigned";
    public const string OrderClaimed = "order.claimed";
    public const string OrderReleased = "order.released";
}

// CRUD operation marker for entity.changed events.
public static class LogisticsEntityOps
{
    public const string Created = "created";
    public const string Updated = "updated";
    public const string Deleted = "deleted";
}

// Canonical entity-tag taxonomy carried by LogisticsMessage.Type. Keep
// in sync with EntityType in Ui/src/hooks/logisticsEvents.ts. The
// "relation:<api>" tag used by RelationTable is in-memory only and
// never flows over the wire.
public static class LogisticsEntityTypes
{
    public const string Nomenclature = "nomenclature";
    public const string Process = "process";
    public const string TareType = "taretype";
    public const string Order = "order";
    public const string Item = "item";
    public const string Tare = "tare";
    public const string Supply = "supply";
    public const string Directory = "directory";
}
