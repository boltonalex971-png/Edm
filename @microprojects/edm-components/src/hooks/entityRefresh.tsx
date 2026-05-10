import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useSyncExternalStore,
} from 'react';

// Tag-based entity invalidation primitive. Lifted from Logistics — generic,
// no plugin coupling. Plugins build their own SignalR-to-tag bridges on top
// (see Logistics's entityRefreshBridge for the canonical example).

export type EntityTag = {
    type: string;
    id?: string;
};

// Membership tag, distinct from the broad `{type}` tag. Search/list views
// can subscribe to it together with per-row id tokens, so they refetch
// when a row is added or removed (create/delete/complete) but ignore
// updates to off-list rows.
export const listTag = (type: string): EntityTag => ({ type: `${type}:list` });

type RefMap = { current: Map<string, number> };
type RefSet = { current: Set<() => void> };

type EntityRefreshValue = {
    counters: RefMap;
    listeners: RefSet;
    invalidate: (tags: EntityTag[]) => void;
};

const EntityRefreshContext = createContext<EntityRefreshValue | null>(null);

function tagKey(t: EntityTag): string {
    return t.id ? `${t.type}:${t.id}` : t.type;
}

export function EntityRefreshProvider({ children }: { children: ReactNode }) {
    const counters = useRef(new Map<string, number>());
    const listeners = useRef(new Set<() => void>());

    const invalidate = useCallback((tags: EntityTag[]) => {
        const m = counters.current;
        for (const t of tags) {
            const k = tagKey(t);
            m.set(k, (m.get(k) ?? 0) + 1);
        }
        for (const l of listeners.current) l();
    }, []);

    const value = useMemo<EntityRefreshValue>(
        () => ({ counters, listeners, invalidate }),
        [invalidate],
    );

    return (
        <EntityRefreshContext.Provider value={value}>
            {children}
        </EntityRefreshContext.Provider>
    );
}

function useCtx(): EntityRefreshValue {
    const ctx = useContext(EntityRefreshContext);
    if (!ctx) {
        throw new Error('EntityRefreshProvider is missing in the tree');
    }
    return ctx;
}

// Subscribes the caller to `tags` and returns a token whose value changes
// only when one of those tags is invalidated. Pass the token into a deps
// array (e.g. useGet(url, [token])). Components whose tags weren't touched
// won't even re-render thanks to useSyncExternalStore.
export function useEntityToken(tags: EntityTag[]): number {
    const ctx = useCtx();
    const fingerprint = tags.map(tagKey).join('|');
    const keys = useMemo(() => tags.map(tagKey), [fingerprint]);

    const subscribe = useCallback(
        (cb: () => void) => {
            ctx.listeners.current.add(cb);
            return () => {
                ctx.listeners.current.delete(cb);
            };
        },
        [ctx],
    );

    const getSnapshot = useCallback(() => {
        const m = ctx.counters.current;
        let sum = 0;
        for (const k of keys) sum += m.get(k) ?? 0;
        return sum;
    }, [ctx, keys]);

    return useSyncExternalStore(subscribe, getSnapshot);
}

export function useInvalidateEntities(): (tags: EntityTag[]) => void {
    return useCtx().invalidate;
}

/** Optional variant — returns a no-op when EntityRefreshProvider is absent
 *  instead of throwing. Used by the package's shared Detail/Editor so they
 *  stay safe in Tech (no provider) while doing real invalidation in Logistics
 *  (provider mounted). */
export function useOptionalInvalidateEntities(): (tags: EntityTag[]) => void {
    const ctx = useContext(EntityRefreshContext);
    return ctx ? ctx.invalidate : NO_OP_INVALIDATE;
}

const NO_OP_INVALIDATE: (tags: EntityTag[]) => void = () => {};
