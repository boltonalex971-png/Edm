import type { Item, TareInfo, UUID } from '@logistics/data/types'
import { useSlotSelection } from '@logistics/hooks/useSlotSelection'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'

export type PendingMove = {
    itemId: UUID
    targetTareId: UUID
    address?: number
}

export type TargetTare<TItem extends Item> = TareInfo & { items: TItem[] }

export type CtxMenuState = { x: number; y: number; itemId: UUID }

export type UseTareTransferConfig<TItem extends Item> = {
    sourceItems: TItem[]
    /** Optional scope so Shift-range stays inside one logical group
     *  (e.g. one source tare in Repacking). */
    itemScopeKey?: (item: TItem) => string
    /** Called once per item consumed by a move/distribute. Repacking uses
     *  this to drop the item from its operator-managed source pool; Allocate
     *  has nothing to do (its pool comes from the server and is filtered by
     *  the hook's own `pending` membership). */
    onItemConsumed?: (itemId: UUID) => void
}

/**
 * Shared workspace state for screens that move items from a flat (or grouped)
 * source pool into one or more target tares. Owns:
 *  - selection (delegated to useSlotSelection)
 *  - target-tare list + expand state
 *  - pending-moves buffer
 *  - optional "anchor" target slot (Repacking's click-to-anchor flow)
 *  - context-menu (x/y/itemId) state and the eligible-id derivation
 *
 * Submission stays per-screen: the caller maps `pending` to whatever request
 * shape its server endpoint expects.
 */
export function useTareTransfer<TItem extends Item>(
    config: UseTareTransferConfig<TItem>,
) {
    const { sourceItems, itemScopeKey, onItemConsumed } = config

    const { selected, setSelected, handleClick, toggleAll, clear } =
        useSlotSelection(sourceItems)

    const [targetTares, setTargetTares] = useState<TargetTare<TItem>[]>([])
    const [expandedTareIds, setExpandedTareIds] = useState<Set<UUID>>(new Set())
    const [pending, setPending] = useState<PendingMove[]>([])
    const [pendingTargetSlot, setPendingTargetSlot] = useState<{
        tareId: UUID
        address: number
    }>()
    const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null)

    // ---- selection ----
    const handleSlotClick = useCallback(
        (item: TItem, e: React.MouseEvent) => {
            handleClick(item, e, itemScopeKey?.(item))
        },
        [handleClick, itemScopeKey],
    )

    const selectByPredicate = useCallback(
        (pred: (item: TItem) => boolean) => {
            setSelected(new Set(sourceItems.filter(pred).map((i) => i.id)))
        },
        [setSelected, sourceItems],
    )

    // ---- target-tare bookkeeping ----
    const expandTare = useCallback((tareId: UUID) => {
        setExpandedTareIds((prev) => {
            if (prev.has(tareId)) return prev
            const next = new Set(prev)
            next.add(tareId)
            return next
        })
    }, [])

    const toggleTareExpanded = useCallback((tareId: UUID) => {
        setExpandedTareIds((prev) => {
            const next = new Set(prev)
            if (next.has(tareId)) next.delete(tareId)
            else next.add(tareId)
            return next
        })
    }, [])

    const addTargetTare = useCallback(
        (tare: TareInfo, items: TItem[] = []) => {
            let added = false
            setTargetTares((prev) => {
                if (prev.some((t) => t.id === tare.id)) return prev
                added = true
                return [...prev, { ...tare, items }]
            })
            expandTare(tare.id)
            return added
        },
        [expandTare],
    )

    const removeTargetTare = useCallback(
        (tareId: UUID) => {
            const movedBackIds = new Set(
                pending
                    .filter((m) => m.targetTareId === tareId)
                    .map((m) => m.itemId),
            )
            setPending((prev) => prev.filter((m) => m.targetTareId !== tareId))
            setTargetTares((prev) => prev.filter((t) => t.id !== tareId))
            setExpandedTareIds((prev) => {
                if (!prev.has(tareId)) return prev
                const next = new Set(prev)
                next.delete(tareId)
                return next
            })
            if (pendingTargetSlot?.tareId === tareId) {
                setPendingTargetSlot(undefined)
            }
            if (movedBackIds.size > 0) {
                setSelected((prev) => {
                    const next = new Set(prev)
                    movedBackIds.forEach((id) => next.delete(id))
                    return next
                })
            }
            return movedBackIds
        },
        [pending, pendingTargetSlot, setSelected],
    )

    const updateTargetTares = useCallback(
        (mut: (prev: TargetTare<TItem>[]) => TargetTare<TItem>[]) =>
            setTargetTares(mut),
        [],
    )

    // ---- transfer primitives ----

    /** Place one specific item at a specific address in the named target.
     *  Used when the caller already chose the slot (e.g. Allocate's
     *  click-on-empty-slot-to-place flow). Does not skip occupied. */
    const addMove = useCallback(
        (item: TItem, tareId: UUID, address?: number) => {
            setPending((prev) => {
                const filtered = prev.filter((m) => m.itemId !== item.id)
                return [
                    ...filtered,
                    { itemId: item.id, targetTareId: tareId, address },
                ]
            })
            setTargetTares((prev) =>
                prev.map((t) =>
                    t.id === tareId
                        ? {
                              ...t,
                              items: [...t.items, { ...item, address } as TItem],
                          }
                        : t,
                ),
            )
            setSelected((prev) => {
                const next = new Set(prev)
                next.delete(item.id)
                return next
            })
            setPendingTargetSlot(undefined)
            onItemConsumed?.(item.id)
        },
        [setSelected, onItemConsumed],
    )

    /** Auto-fill across one or all target tares: walks each target in order,
     *  skipping occupied addresses, packing items into the first capacity
     *  hole. Powers both the "Auto-fill" toolbar button and the context-menu
     *  "Fill into <tare>" action. */
    const distribute = useCallback(
        (itemIds: UUID[], onlyTareId?: UUID) => {
            const pendingItemIds = new Set(pending.map((p) => p.itemId))
            const itemsToFill = sourceItems.filter(
                (i) => itemIds.includes(i.id) && !pendingItemIds.has(i.id),
            )
            if (itemsToFill.length === 0) return
            const tareIdsInScope = onlyTareId
                ? new Set([onlyTareId])
                : new Set(targetTares.map((t) => t.id))
            if (tareIdsInScope.size === 0) return

            const remaining = [...itemsToFill]
            const newPending: PendingMove[] = [...pending]
            const filledTareIds = new Set<UUID>()
            const updated = targetTares.map((t) => {
                if (!tareIdsInScope.has(t.id)) return t
                const cap = Math.floor(t.capacity)
                const occupied = new Set(t.items.map((i) => i.address))
                const items = [...t.items]
                const sizeBefore = items.length
                for (
                    let addr = 1;
                    addr <= cap && remaining.length > 0;
                    addr++
                ) {
                    if (occupied.has(addr)) continue
                    const item = remaining.shift()!
                    items.push({ ...item, address: addr } as TItem)
                    newPending.push({
                        itemId: item.id,
                        targetTareId: t.id,
                        address: addr,
                    })
                }
                if (items.length > sizeBefore) filledTareIds.add(t.id)
                return { ...t, items }
            })
            setPending(newPending)
            setTargetTares(updated)

            const movedIds = new Set(
                itemsToFill
                    .filter((si) => !remaining.includes(si))
                    .map((i) => i.id),
            )
            if (movedIds.size > 0) {
                setSelected((prev) => {
                    const next = new Set(prev)
                    movedIds.forEach((id) => next.delete(id))
                    return next
                })
                if (onItemConsumed) {
                    movedIds.forEach((id) => onItemConsumed(id))
                }
            }
            if (filledTareIds.size > 0) {
                setExpandedTareIds((prev) => {
                    const next = new Set(prev)
                    filledTareIds.forEach((id) => next.add(id))
                    return next
                })
            }
        },
        [sourceItems, targetTares, pending, setSelected, onItemConsumed],
    )

    /** Place every currently-selected source item into one target tare,
     *  starting at `startAddress` and skipping already-occupied slots.
     *  Items are placed in source-address order so the visible source layout
     *  is preserved. Powers Repacking's click-an-empty-slot-with-selection
     *  flow. */
    const placeAt = useCallback(
        (targetTareId: UUID, startAddress: number) => {
            const target = targetTares.find((t) => t.id === targetTareId)
            if (!target) return
            const itemsToPlace = sourceItems
                .filter((i) => selected.has(i.id))
                .sort((a, b) => (a.address ?? 0) - (b.address ?? 0))
            if (itemsToPlace.length === 0) return

            const occupied = new Set(target.items.map((i) => i.address))
            const cap = Math.floor(target.capacity)
            const placed: { item: TItem; address: number }[] = []
            let queueIdx = 0
            let addr = startAddress
            while (queueIdx < itemsToPlace.length && addr <= cap) {
                if (!occupied.has(addr)) {
                    placed.push({ item: itemsToPlace[queueIdx], address: addr })
                    occupied.add(addr)
                    queueIdx++
                }
                addr++
            }
            if (placed.length === 0) return

            const placedIds = new Set(placed.map((p) => p.item.id))
            const newMoves: PendingMove[] = placed.map(({ item, address }) => ({
                itemId: item.id,
                targetTareId,
                address,
            }))
            setPending((prev) => [
                ...prev.filter((m) => !placedIds.has(m.itemId)),
                ...newMoves,
            ])
            setTargetTares((prev) =>
                prev.map((t) =>
                    t.id !== targetTareId
                        ? t
                        : {
                              ...t,
                              items: [
                                  ...t.items,
                                  ...placed.map(
                                      ({ item, address }) =>
                                          ({ ...item, address } as TItem),
                                  ),
                              ],
                          },
                ),
            )
            setSelected((prev) => {
                const next = new Set(prev)
                placedIds.forEach((id) => next.delete(id))
                return next
            })
            setPendingTargetSlot(undefined)
            if (onItemConsumed) {
                placedIds.forEach((id) => onItemConsumed(id))
            }
        },
        [targetTares, sourceItems, selected, setSelected, onItemConsumed],
    )

    const reset = useCallback(() => {
        setPending([])
        setSelected(new Set())
        setPendingTargetSlot(undefined)
        // Roll back the visible items in each target so the screen matches
        // the pre-pending state. Items that were already committed (not in
        // `pending`) stay put.
        setTargetTares((prev) =>
            prev.map((t) => ({
                ...t,
                items: t.items.filter(
                    (i) =>
                        !pending.some(
                            (p) =>
                                p.itemId === i.id && p.targetTareId === t.id,
                        ),
                ),
            })),
        )
    }, [pending, setSelected])

    const clearPending = useCallback(() => setPending([]), [])

    // ---- context menu ----
    const openContextMenu = useCallback(
        (item: TItem, e: React.MouseEvent) => {
            e.preventDefault()
            setCtxMenu({ x: e.clientX, y: e.clientY, itemId: item.id })
        },
        [],
    )
    const closeContextMenu = useCallback(() => setCtxMenu(null), [])

    /** Items the menu acts on: if the trigger item is part of the current
     *  selection, all selected items; otherwise just the trigger. */
    const ctxTargetIds = useMemo<UUID[]>(() => {
        if (!ctxMenu) return []
        return selected.has(ctxMenu.itemId)
            ? [...selected]
            : [ctxMenu.itemId]
    }, [ctxMenu, selected])

    const ctxEligibleIds = useMemo(() => {
        const pendingItemIds = new Set(pending.map((p) => p.itemId))
        return ctxTargetIds.filter((id) => !pendingItemIds.has(id))
    }, [ctxTargetIds, pending])

    return {
        // selection
        selected,
        setSelected,
        handleSlotClick,
        toggleAll,
        clear,
        selectByPredicate,
        // targets
        targetTares,
        addTargetTare,
        removeTargetTare,
        updateTargetTares,
        expandedTareIds,
        toggleTareExpanded,
        expandTare,
        // transfer
        pending,
        setPending,
        addMove,
        distribute,
        placeAt,
        reset,
        clearPending,
        pendingTargetSlot,
        setPendingTargetSlot,
        // context menu
        ctxMenu,
        openContextMenu,
        closeContextMenu,
        ctxEligibleIds,
    }
}
