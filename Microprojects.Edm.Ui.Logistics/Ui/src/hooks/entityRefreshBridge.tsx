import { useCallback } from 'react'
import api from '../features/api/api'
import {
    type EntityTag,
    listTag,
    useInvalidateEntities,
} from '@microprojects/edm-components/hooks'
import { useLockSetters } from '@microprojects/edm-components/hooks'
import {
    EntityOp,
    EntityType,
    EventKind,
    type LogisticsMessage,
} from './logisticsEvents'
import useSignalR, { getCurrentConnectionId } from './signalRHooks'

// Bridges the "Logistics" SignalR channel to in-page state: tag-based
// invalidation for entity.changed and order.* events, lock map updates
// for entity.locked / entity.unlocked, claim map updates for
// order.claimed / order.released. Self-echoes are suppressed: the
// publisher already updated its local state synchronously.
export function EntityRefreshSignalRBridge() {
    const invalidate = useInvalidateEntities()
    const { setEntityLock, setOrderClaim } = useLockSetters()

    const onReceive = useCallback(
        (msg: LogisticsMessage) => {
            const own = getCurrentConnectionId()
            if (own && msg.originConnectionId === own) return

            switch (msg.kind) {
                case EventKind.EntityChanged: {
                    const isMembershipChange =
                        msg.op === EntityOp.Created ||
                        msg.op === EntityOp.Deleted
                    if (msg.type === EntityType.Directory) {
                        // Folders are shared across every leaf-type master view.
                        const tags: EntityTag[] = []
                        for (const t of Object.values(EntityType)) {
                            tags.push({ type: t })
                            if (msg.id) tags.push({ type: t, id: msg.id })
                            if (isMembershipChange) tags.push(listTag(t))
                        }
                        invalidate(tags)
                    } else {
                        const tags: EntityTag[] = msg.id
                            ? [
                                  { type: msg.type },
                                  { type: msg.type, id: msg.id },
                              ]
                            : [{ type: msg.type }]
                        if (isMembershipChange) tags.push(listTag(msg.type))
                        invalidate(tags)
                    }
                    return
                }

                case EventKind.EntityLocked:
                    setEntityLock(msg.type, msg.id, {
                        username: msg.username,
                        connectionId: msg.originConnectionId ?? null,
                    })
                    return

                case EventKind.EntityUnlocked:
                    setEntityLock(msg.type, msg.id, null)
                    return

                case EventKind.OrderClaimed:
                    setOrderClaim(msg.orderId, {
                        username: msg.username,
                        connectionId: msg.originConnectionId ?? null,
                    })
                    return

                case EventKind.OrderReleased:
                    setOrderClaim(msg.orderId, null)
                    return

                case EventKind.OrderExecuted:
                case EventKind.OrderOutputsAllocated:
                case EventKind.OrderGradesAssigned:
                    invalidate([
                        { type: 'order' },
                        { type: 'order', id: msg.orderId },
                    ])
                    return

                case EventKind.OrderCompleted:
                    // Completion removes the order from the active list view.
                    invalidate([
                        { type: 'order' },
                        { type: 'order', id: msg.orderId },
                        listTag('order'),
                    ])
                    return

                default: {
                    // Exhaustiveness check: a new EventKind that isn't
                    // handled above turns this into a compile error.
                    const _exhaustive: never = msg
                    void _exhaustive
                    return
                }
            }
        },
        [invalidate, setEntityLock, setOrderClaim],
    )

    useSignalR(`${api.baseUrl}/hub`, 'Logistics', onReceive)
    return null
}
