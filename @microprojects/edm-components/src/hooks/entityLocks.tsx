import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useSyncExternalStore,
} from 'react';

// Active-lock primitives, lifted from Logistics with the publisher made
// injectable so the package stays free of plugin-specific event factories.
//
// Two lock kinds, kept side-by-side:
//   * entity locks: edit-mode locks keyed by `${type}:${id}`. Used by
//     Detail editors to prevent two operators stepping on each other.
//   * order claims: queue-of-one keyed by `orderId`. Used by the
//     execution flow.
//
// Receivers consult the active map via useEntityLockState / useOrderClaimState;
// publishers broadcast on mount and release on unmount via the acquire hooks.

type LockHolder = { username: string; connectionId: string | null };

type LockStoreValue = {
    entityLocks: { current: Map<string, LockHolder> };
    orderClaims: { current: Map<string, LockHolder> };
    listeners: { current: Set<() => void> };
    setEntityLock: (type: string, id: string, holder: LockHolder | null) => void;
    setOrderClaim: (orderId: string, holder: LockHolder | null) => void;
    publisher: LockPublisher;
};

/** Plugin-injected publisher used by acquire hooks to broadcast lock state.
 *  All members are optional — if omitted, the acquire hooks apply state
 *  locally only (no broadcast). The plugin's SignalR-to-store bridge is
 *  written separately and uses the bridge-facing setters from useLockSetters(). */
export interface LockPublisher {
    publishEntityLock?: (type: string, id: string, username: string) => void;
    publishEntityUnlock?: (type: string, id: string, username: string) => void;
    publishOrderClaim?: (orderId: string, username: string) => void;
    publishOrderRelease?: (orderId: string, username: string) => void;
    /** Returns the current SignalR/connection id, used by readers to detect own locks. */
    getCurrentConnectionId?: () => string | null;
}

const EMPTY_PUBLISHER: LockPublisher = {};

const LockStoreContext = createContext<LockStoreValue | null>(null);

function entityKey(type: string, id: string): string {
    return `${type}:${id}`;
}

interface LockProviderProps {
    children: ReactNode;
    /** Plugin-specific publisher. Omit for read-only / local-only behaviour. */
    publisher?: LockPublisher;
}

export function LockProvider({ children, publisher }: LockProviderProps) {
    const entityLocks = useRef(new Map<string, LockHolder>());
    const orderClaims = useRef(new Map<string, LockHolder>());
    const listeners = useRef(new Set<() => void>());

    const fire = useCallback(() => {
        for (const l of listeners.current) l();
    }, []);

    const setEntityLock = useCallback(
        (type: string, id: string, holder: LockHolder | null) => {
            const k = entityKey(type, id);
            if (holder) entityLocks.current.set(k, holder);
            else entityLocks.current.delete(k);
            fire();
        },
        [fire],
    );

    const setOrderClaim = useCallback(
        (orderId: string, holder: LockHolder | null) => {
            if (holder) orderClaims.current.set(orderId, holder);
            else orderClaims.current.delete(orderId);
            fire();
        },
        [fire],
    );

    const value = useMemo<LockStoreValue>(
        () => ({
            entityLocks,
            orderClaims,
            listeners,
            setEntityLock,
            setOrderClaim,
            publisher: publisher ?? EMPTY_PUBLISHER,
        }),
        [setEntityLock, setOrderClaim, publisher],
    );

    return (
        <LockStoreContext.Provider value={value}>
            {children}
        </LockStoreContext.Provider>
    );
}

function useStore(): LockStoreValue {
    const ctx = useContext(LockStoreContext);
    if (!ctx) throw new Error('LockProvider is missing in the tree');
    return ctx;
}

/** Optional variant — returns null when LockProvider is absent instead of
 *  throwing. Used by the state/acquire hooks so consumers without a provider
 *  (e.g. Tech, which doesn't wire SignalR locks) can still call them safely
 *  and just see "no lock" everywhere. */
function useOptionalStore(): LockStoreValue | null {
    return useContext(LockStoreContext);
}

/** Bridge-facing setters. Used by a plugin-side SignalR bridge to apply
 *  incoming lock / claim messages observed from other clients. */
export function useLockSetters(): Pick<LockStoreValue, 'setEntityLock' | 'setOrderClaim'> {
    const s = useStore();
    return { setEntityLock: s.setEntityLock, setOrderClaim: s.setOrderClaim };
}

function subscribeFactory(set: { current: Set<() => void> }) {
    return (cb: () => void) => {
        set.current.add(cb);
        return () => {
            set.current.delete(cb);
        };
    };
}

export type LockState = {
    lockedBy: string | null;
    isOwn: boolean;
};

const NO_LOCK: LockState = { lockedBy: null, isOwn: false };

export function useEntityLockState(
    type: string | undefined,
    id: string | undefined,
): LockState {
    const s = useOptionalStore();
    const noopSubscribe = useCallback(() => () => {}, []);
    const subscribe = useMemo(
        () => (s ? subscribeFactory(s.listeners) : noopSubscribe),
        [s, noopSubscribe],
    );
    const getCurrentConnectionId = s?.publisher.getCurrentConnectionId;
    const getSnapshot = useCallback((): LockState => {
        if (!s || !type || !id) return NO_LOCK;
        const holder = s.entityLocks.current.get(entityKey(type, id));
        if (!holder) return NO_LOCK;
        const ownConn = getCurrentConnectionId?.() ?? null;
        const isOwn = !!ownConn && holder.connectionId === ownConn;
        return { lockedBy: holder.username, isOwn };
    }, [s, type, id, getCurrentConnectionId]);

    /* useSyncExternalStore needs a stable snapshot reference for "no lock"
       so React doesn't infinite-loop. Hold the previous result and return
       it when fields are unchanged. */
    const cached = useRef<LockState>(NO_LOCK);
    return useSyncExternalStore(subscribe, () => {
        const next = getSnapshot();
        const prev = cached.current;
        if (prev.lockedBy === next.lockedBy && prev.isOwn === next.isOwn) {
            return prev;
        }
        cached.current = next;
        return next;
    });
}

export function useOrderClaimState(orderId: string | undefined): LockState {
    const s = useOptionalStore();
    const noopSubscribe = useCallback(() => () => {}, []);
    const subscribe = useMemo(
        () => (s ? subscribeFactory(s.listeners) : noopSubscribe),
        [s, noopSubscribe],
    );
    const getCurrentConnectionId = s?.publisher.getCurrentConnectionId;
    const getSnapshot = useCallback((): LockState => {
        if (!s || !orderId) return NO_LOCK;
        const holder = s.orderClaims.current.get(orderId);
        if (!holder) return NO_LOCK;
        const ownConn = getCurrentConnectionId?.() ?? null;
        const isOwn = !!ownConn && holder.connectionId === ownConn;
        return { lockedBy: holder.username, isOwn };
    }, [s, orderId, getCurrentConnectionId]);

    const cached = useRef<LockState>(NO_LOCK);
    return useSyncExternalStore(subscribe, () => {
        const next = getSnapshot();
        const prev = cached.current;
        if (prev.lockedBy === next.lockedBy && prev.isOwn === next.isOwn) {
            return prev;
        }
        cached.current = next;
        return next;
    });
}

/** Broadcasts entity.locked when `active` becomes true and entity.unlocked
 *  when it becomes false (or on unmount). Best-effort: a hard crash on the
 *  publisher side leaves the lock visible until the next mutation forces a
 *  reload; receivers will rediscover state on the next entity.locked broadcast. */
export function useAcquireEntityLock(
    type: string | undefined,
    id: string | undefined,
    active: boolean,
    username: string,
) {
    const s = useOptionalStore();

    useEffect(() => {
        if (!s || !active || !type || !id || !username) return;

        // Apply locally so the same-tab UI flips immediately even before
        // the hub round-trips the broadcast back.
        const holder: LockHolder = {
            username,
            connectionId: s.publisher.getCurrentConnectionId?.() ?? null,
        };
        s.setEntityLock(type, id, holder);

        s.publisher.publishEntityLock?.(type, id, username);

        const release = () => {
            s.setEntityLock(type, id, null);
            s.publisher.publishEntityUnlock?.(type, id, username);
        };

        const onUnload = () => release();
        window.addEventListener('beforeunload', onUnload);
        return () => {
            window.removeEventListener('beforeunload', onUnload);
            release();
        };
    }, [s, type, id, active, username]);
}

/** Broadcasts order.claimed while mounted/active; releases on unmount. */
export function useAcquireOrderClaim(
    orderId: string | undefined,
    active: boolean,
    username: string,
) {
    const s = useOptionalStore();

    useEffect(() => {
        if (!s || !active || !orderId || !username) return;

        const holder: LockHolder = {
            username,
            connectionId: s.publisher.getCurrentConnectionId?.() ?? null,
        };
        s.setOrderClaim(orderId, holder);

        s.publisher.publishOrderClaim?.(orderId, username);

        const release = () => {
            s.setOrderClaim(orderId, null);
            s.publisher.publishOrderRelease?.(orderId, username);
        };

        const onUnload = () => release();
        window.addEventListener('beforeunload', onUnload);
        return () => {
            window.removeEventListener('beforeunload', onUnload);
            release();
        };
    }, [s, orderId, active, username]);
}
