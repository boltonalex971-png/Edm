using System;

namespace Microprojects.Edm.Ui.Logistics.Events;

public class LogisticsMessage
{
    // Single SignalR channel for all in-plugin pub/sub. The plugin name is
    // the convention; the Kind discriminator carries the actual event type.
    public const string Channel = "Logistics";

    // Discriminator. "entity.changed" for CRUD; "entity.locked" /
    // "entity.unlocked" for client-driven edit-mode locks; "order.executed"
    // / "order.completed" / "order.outputs-allocated" / "order.grades-assigned"
    // for server-driven domain flows; "order.claimed" / "order.released"
    // for client-driven OrderRunView occupancy.
    public string Kind { get; set; } = "";

    // Entity tag for "entity.changed" — matches the client tag taxonomy
    // ("nomenclature", "process", "taretype", "order", "item", "tare",
    // "supply", "directory").
    public string? Type { get; set; }

    public Guid? Id { get; set; }

    // "created" | "updated" | "deleted" — informational; clients invalidate
    // the same way regardless.
    public string? Op { get; set; }

    // Carries the order id for semantic order.* events.
    public Guid? OrderId { get; set; }

    // Carried by client-driven entity.locked / order.claimed events so other
    // clients can render "Locked by {username}" / "Executing by {username}".
    public string? Username { get; set; }

    // Hub connection id of the user who triggered the change. Receivers
    // suppress self-echo when this matches their own connection.
    public string? OriginConnectionId { get; set; }
}
