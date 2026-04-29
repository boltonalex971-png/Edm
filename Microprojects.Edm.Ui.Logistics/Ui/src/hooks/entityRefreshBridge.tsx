import { useCallback } from 'react'
import api from '../features/api/api'
import { useInvalidateEntities } from './entityRefresh'
import useSignalR, { getCurrentConnectionId } from './signalRHooks'

type LogisticsMessage = {
    kind: string
    type?: string
    id?: string
    op?: 'created' | 'updated' | 'deleted'
    orderId?: string
    originConnectionId?: string
}

// Bridges the "Logistics" SignalR channel to the in-page entity-refresh
// system. Entity-changed messages invalidate the matching tag (and tag+id);
// order.* semantic events invalidate the affected order. Self-echoes are
// suppressed: the local invalidate(...) at the publishing site already
// handled the originator, so a hub round-trip would only cause a redundant
// refetch.
export function EntityRefreshSignalRBridge() {
    const invalidate = useInvalidateEntities()

    const onReceive = useCallback(
        (msg: LogisticsMessage) => {
            const own = getCurrentConnectionId()
            if (own && msg.originConnectionId === own) return

            if (msg.kind === 'entity-changed' && msg.type) {
                invalidate(
                    msg.id
                        ? [{ type: msg.type }, { type: msg.type, id: msg.id }]
                        : [{ type: msg.type }],
                )
                return
            }

            if (msg.kind?.startsWith('order.') && msg.orderId) {
                invalidate([
                    { type: 'order' },
                    { type: 'order', id: msg.orderId },
                ])
            }
        },
        [invalidate],
    )

    useSignalR(`${api.baseUrl}/hub`, 'Logistics', onReceive)
    return null
}
