import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useSyncExternalStore,
} from 'react'
import { events, parseEntityType } from './logisticsEvents'
import {
    getCurrentConnectionId,
    publishLogisticsMessage,
} from './signalRHooks'

// Active locks keyed by `${type}:${id}` for entity edit-mode locks, and
// by `orderId` for order-execution claims. Value is the holder's
// {username, connectionId}. Receivers consult this map; publishers
// broadcast on mount and release on unmount.
type LockHolder = { username: string; connectionId: string | null }

type LockStoreValue = {
    entityLocks: { current: Map<string, LockHolder> }
    orderClaims: { current: Map<string, LockHolder> }
    listeners: { current: Set<() => void> }
    setEntityLock: (
        type: string,
        id: string,
        holder: LockHolder | null,
    ) => void
    setOrderClaim: (orderId: string, holder: LockHolder | null) => void
}

const LockStoreContext = createContext<LockStoreValue | null>(null)

function entityKey(type: string, id: string): string {
    return `${type}:${id}`
}

export function LockProvider({ children }: { children: ReactNode }) {
    const entityLocks = useRef(new Map<string, LockHolder>())
    const orderClaims = useRef(new Map<string, LockHolder>())
    const listeners = useRef(new Set<() => void>())

    const fire = useCallback(() => {
        for (const l of listeners.current) l()
    }, [])

    const setEntityLock = useCallback(
        (type: string, id: string, holder: LockHolder | null) => {
            const k = entityKey(type, id)
            if (holder) entityLocks.current.set(k, holder)
            else entityLocks.current.delete(k)
            fire()
        },
        [fire],
    )

    const setOrderClaim = useCallback(
        (orderId: string, holder: LockHolder | null) => {
            if (holder) orderClaims.current.set(orderId, holder)
            else orderClaims.current.delete(orderId)
            fire()
        },
        [fire],
    )

    const value = useMemo<LockStoreValue>(
        () => ({
            entityLocks,
            orderClaims,
            listeners,
            setEntityLock,
            setOrderClaim,
        }),
        [setEntityLock, setOrderClaim],
    )

    return (
        <LockStoreContext.Provider value={value}>
            {children}
        </LockStoreContext.Provider>
    )
}

function useStore(): LockStoreValue {
    const ctx = useContext(LockStoreContext)
    if (!ctx) throw new Error('LockProvider is missing in the tree')
    return ctx
}

// Bridge-facing setters. Used only by entityRefreshBridge.tsx to apply
// incoming entity.locked / order.claimed messages.
export function useLockSetters(): Pick<
    LockStoreValue,
    'setEntityLock' | 'setOrderClaim'
> {
    const s = useStore()
    return { setEntityLock: s.setEntityLock, setOrderClaim: s.setOrderClaim }
}

function subscribeFactory(set: { current: Set<() => void> }) {
    return (cb: () => void) => {
        set.current.add(cb)
        return () => {
            set.current.delete(cb)
        }
    }
}

export type LockState = {
    lockedBy: string | null
    isOwn: boolean
}

const NO_LOCK: LockState = { lockedBy: null, isOwn: false }

export function useEntityLockState(
    type: string | undefined,
    id: string | undefined,
): LockState {
    const s = useStore()
    const subscribe = useMemo(() => subscribeFactory(s.listeners), [s])
    const getSnapshot = useCallback((): LockState => {
        if (!type || !id) return NO_LOCK
        const holder = s.entityLocks.current.get(entityKey(type, id))
        if (!holder) return NO_LOCK
        const ownConn = getCurrentConnectionId()
        const isOwn = !!ownConn && holder.connectionId === ownConn
        return { lockedBy: holder.username, isOwn }
    }, [s, type, id])

    // useSyncExternalStore needs a stable snapshot reference for "no lock"
    // so React doesn't infinite-loop. NO_LOCK is module-scope.
    const cached = useRef<LockState>(NO_LOCK)
    return useSyncExternalStore(
        subscribe,
        () => {
            const next = getSnapshot()
            const prev = cached.current
            if (
                prev.lockedBy === next.lockedBy &&
                prev.isOwn === next.isOwn
            ) {
                return prev
            }
            cached.current = next
            return next
        },
    )
}

export function useOrderClaimState(orderId: string | undefined): LockState {
    const s = useStore()
    const subscribe = useMemo(() => subscribeFactory(s.listeners), [s])
    const getSnapshot = useCallback((): LockState => {
        if (!orderId) return NO_LOCK
        const holder = s.orderClaims.current.get(orderId)
        if (!holder) return NO_LOCK
        const ownConn = getCurrentConnectionId()
        const isOwn = !!ownConn && holder.connectionId === ownConn
        return { lockedBy: holder.username, isOwn }
    }, [s, orderId])

    const cached = useRef<LockState>(NO_LOCK)
    return useSyncExternalStore(
        subscribe,
        () => {
            const next = getSnapshot()
            const prev = cached.current
            if (
                prev.lockedBy === next.lockedBy &&
                prev.isOwn === next.isOwn
            ) {
                return prev
            }
            cached.current = next
            return next
        },
    )
}

// Broadcasts entity.locked when `active` becomes true and entity.unlocked
// when it becomes false (or on unmount). Best-effort — a hard crash on
// the publisher side leaves the lock visible until the next mutation
// causes the entity to be reloaded; receivers will rediscover state on
// the next entity.locked broadcast.
export function useAcquireEntityLock(
    type: string | undefined,
    id: string | undefined,
    active: boolean,
    username: string,
) {
    const s = useStore()

    useEffect(() => {
        if (!active || !type || !id || !username) return
        const canonical = parseEntityType(type)
        if (!canonical) return

        // Apply locally so the same-tab UI flips immediately even before
        // the hub round-trips the broadcast back.
        const holder: LockHolder = {
            username,
            connectionId: getCurrentConnectionId(),
        }
        s.setEntityLock(canonical, id, holder)

        publishLogisticsMessage(events.entityLocked(canonical, id, username))

        const release = () => {
            s.setEntityLock(canonical, id, null)
            publishLogisticsMessage(
                events.entityUnlocked(canonical, id, username),
            )
        }

        const onUnload = () => release()
        window.addEventListener('beforeunload', onUnload)
        return () => {
            window.removeEventListener('beforeunload', onUnload)
            release()
        }
    }, [s, type, id, active, username])
}

// Broadcasts order.claimed while mounted/active; releases on unmount.
export function useAcquireOrderClaim(
    orderId: string | undefined,
    active: boolean,
    username: string,
) {
    const s = useStore()

    useEffect(() => {
        if (!active || !orderId || !username) return

        const holder: LockHolder = {
            username,
            connectionId: getCurrentConnectionId(),
        }
        s.setOrderClaim(orderId, holder)

        publishLogisticsMessage(events.orderClaimed(orderId, username))

        const release = () => {
            s.setOrderClaim(orderId, null)
            publishLogisticsMessage(events.orderReleased(orderId, username))
        }

        const onUnload = () => release()
        window.addEventListener('beforeunload', onUnload)
        return () => {
            window.removeEventListener('beforeunload', onUnload)
            release()
        }
    }, [s, orderId, active, username])
}
