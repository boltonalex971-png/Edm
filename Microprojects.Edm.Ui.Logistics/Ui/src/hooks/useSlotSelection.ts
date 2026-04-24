import type { UUID } from '@logistics/data/types'
import { useCallback, useEffect, useRef, useState } from 'react'

type Identifiable = { id: UUID }

/**
 * Slot selection with click / Ctrl-click toggle / Shift-range over an ordered
 * list. The list identity matters for Shift-range: callers pass the same
 * ordered array they render, and the hook computes the range by index.
 *
 * Optional `scopeKey` on each click confines Shift-range to one logical
 * group (e.g. one tare): if the current click's scope differs from the
 * last click's, Shift behaves like a plain click instead of extending the
 * range — slots from different tares are independent.
 */
export function useSlotSelection<T extends Identifiable>(items: T[]) {
    const [selected, setSelected] = useState<Set<UUID>>(new Set())
    const lastRef = useRef<{ id: UUID; scope?: string } | null>(null)

    useEffect(() => {
        setSelected((prev) => {
            if (prev.size === 0) return prev
            const live = new Set(items.map((i) => i.id))
            let changed = false
            const next = new Set<UUID>()
            for (const id of prev) {
                if (live.has(id)) next.add(id)
                else changed = true
            }
            return changed ? next : prev
        })
    }, [items])

    const handleClick = useCallback(
        (
            item: T,
            e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
            scopeKey?: string,
        ) => {
            setSelected((prev) => {
                const sameScope =
                    scopeKey === undefined ||
                    lastRef.current?.scope === scopeKey
                if (e.shiftKey && lastRef.current && sameScope) {
                    const lastIdx = items.findIndex((i) => i.id === lastRef.current?.id)
                    const curIdx = items.findIndex((i) => i.id === item.id)
                    if (lastIdx >= 0 && curIdx >= 0) {
                        const lo = Math.min(lastIdx, curIdx)
                        const hi = Math.max(lastIdx, curIdx)
                        const next = new Set(prev)
                        for (let i = lo; i <= hi; i++) next.add(items[i].id)
                        return next
                    }
                }
                if (e.ctrlKey || e.metaKey) {
                    const next = new Set(prev)
                    if (next.has(item.id)) next.delete(item.id)
                    else next.add(item.id)
                    return next
                }
                if (prev.size === 1 && prev.has(item.id)) {
                    return new Set()
                }
                return new Set([item.id])
            })
            lastRef.current = { id: item.id, scope: scopeKey }
        },
        [items],
    )

    const toggleAll = useCallback(() => {
        setSelected((prev) =>
            prev.size === items.length && items.length > 0
                ? new Set()
                : new Set(items.map((i) => i.id)),
        )
    }, [items])

    const clear = useCallback(() => setSelected(new Set()), [])

    return { selected, setSelected, handleClick, toggleAll, clear }
}
