import { getCurrentConnectionId } from './signalRHooks'

// Kind constants. Keep in sync with LogisticsEventKinds in
// Microprojects.Edm.Ui.Logistics/Events/LogisticsEventKinds.cs — the
// contract is the wire string, so both sides must agree on the literal
// values.
export const EventKind = {
    EntityChanged: 'entity.changed',
    EntityLocked: 'entity.locked',
    EntityUnlocked: 'entity.unlocked',
    OrderExecuted: 'order.executed',
    OrderCompleted: 'order.completed',
    OrderOutputsAllocated: 'order.outputs-allocated',
    OrderGradesAssigned: 'order.grades-assigned',
    OrderClaimed: 'order.claimed',
    OrderReleased: 'order.released',
} as const

export type EventKind = (typeof EventKind)[keyof typeof EventKind]

export const EntityOp = {
    Created: 'created',
    Updated: 'updated',
    Deleted: 'deleted',
} as const
export type EntityOp = (typeof EntityOp)[keyof typeof EntityOp]

// Canonical entity-tag taxonomy carried by entity.changed / entity.locked
// / entity.unlocked. Keep in sync with LogisticsEntityTypes in
// Microprojects.Edm.Ui.Logistics/Events/LogisticsEventKinds.cs.
export const EntityType = {
    Nomenclature: 'nomenclature',
    Process: 'process',
    TareType: 'taretype',
    Order: 'order',
    Item: 'item',
    Tare: 'tare',
    Supply: 'supply',
    Directory: 'directory',
} as const
export type EntityType = (typeof EntityType)[keyof typeof EntityType]

const ENTITY_TYPE_VALUES: ReadonlySet<string> = new Set(
    Object.values(EntityType),
)

// Soft-narrow at boundaries where an arbitrary string flows in (page
// props, URL params). Returns null for unrecognised values so callers
// can no-op rather than publishing garbage on the wire.
export function parseEntityType(s: string | undefined): EntityType | null {
    return s && ENTITY_TYPE_VALUES.has(s) ? (s as EntityType) : null
}

// Per-RelationTable in-memory tag for self-invalidation. Never sent over
// the wire — the bridge only handles canonical EntityType values.
export type RelationTagType = `relation:${string}`
export const relationTag = (api: string): RelationTagType => `relation:${api}`

// Discriminated union of every payload shape carried by the "Logistics"
// channel. Receivers narrow on `kind`; publishers use the builders below
// so a missed field is a type error rather than a runtime no-op.
export type EntityChangedMessage = {
    kind: typeof EventKind.EntityChanged
    type: EntityType
    id?: string
    op: EntityOp
    originConnectionId?: string
}

export type EntityLockedMessage = {
    kind: typeof EventKind.EntityLocked
    type: EntityType
    id: string
    username: string
    originConnectionId?: string
}

export type EntityUnlockedMessage = {
    kind: typeof EventKind.EntityUnlocked
    type: EntityType
    id: string
    username: string
    originConnectionId?: string
}

export type OrderEventMessage = {
    kind:
        | typeof EventKind.OrderExecuted
        | typeof EventKind.OrderCompleted
        | typeof EventKind.OrderOutputsAllocated
        | typeof EventKind.OrderGradesAssigned
    orderId: string
    originConnectionId?: string
}

export type OrderClaimedMessage = {
    kind: typeof EventKind.OrderClaimed
    orderId: string
    username: string
    originConnectionId?: string
}

export type OrderReleasedMessage = {
    kind: typeof EventKind.OrderReleased
    orderId: string
    username: string
    originConnectionId?: string
}

export type LogisticsMessage =
    | EntityChangedMessage
    | EntityLockedMessage
    | EntityUnlockedMessage
    | OrderEventMessage
    | OrderClaimedMessage
    | OrderReleasedMessage

// Builders. Each stamps `originConnectionId` automatically so callers
// don't have to remember; that field is what the bridge uses to suppress
// self-echo.
function originId(): string | undefined {
    return getCurrentConnectionId() ?? undefined
}

export const events = {
    entityLocked: (
        type: EntityType,
        id: string,
        username: string,
    ): EntityLockedMessage => ({
        kind: EventKind.EntityLocked,
        type,
        id,
        username,
        originConnectionId: originId(),
    }),
    entityUnlocked: (
        type: EntityType,
        id: string,
        username: string,
    ): EntityUnlockedMessage => ({
        kind: EventKind.EntityUnlocked,
        type,
        id,
        username,
        originConnectionId: originId(),
    }),
    orderClaimed: (orderId: string, username: string): OrderClaimedMessage => ({
        kind: EventKind.OrderClaimed,
        orderId,
        username,
        originConnectionId: originId(),
    }),
    orderReleased: (
        orderId: string,
        username: string,
    ): OrderReleasedMessage => ({
        kind: EventKind.OrderReleased,
        orderId,
        username,
        originConnectionId: originId(),
    }),
}
