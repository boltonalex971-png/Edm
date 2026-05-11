import api from '@features/api/api'
import {
    HierarchyPicker,
    findInHierarchy,
    pruneHierarchy,
} from '@logistics/components/HierarchyPicker'
import { PageTitle } from '@logistics/components/PageTitle'
import { TareBarcodePicker } from '@logistics/components/tare/TareBarcodePicker'
import { TareGroupRow } from '@logistics/components/tare/TareGroupRow'
import type { SlotData } from '@logistics/components/tare/TareSchematic'
import { GradeLegend } from '@logistics/components/transfer/GradeLegend'
import { NomenclatureLegend } from '@logistics/components/transfer/NomenclatureLegend'
import {
    type ContextTareOption,
    TransferContextMenu,
} from '@logistics/components/transfer/TransferContextMenu'
import {
    selectionSummary,
    visibleGrades,
    visibleNomenclatures,
} from '@logistics/components/transfer/visibleFromItems'
import type {
    AvailableTare,
    Item,
    Nomenclature,
    NomenclatureTareType,
    RepackMove,
    RepackRequest,
    RepackResult,
    TareInfo,
    TreeDataItem,
    UUID,
} from '@logistics/data/types'
import { getData, postData, useGet } from '@logistics/hooks/hooks'
import { useTareTransfer } from '@logistics/hooks/useTareTransfer'
import { formatUnits } from '@logistics/utils/format'
import { SmartScroll, SmartScrollContent } from '@microprojects/tools'
import { Button } from '@mui/material'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './Repacking.css'

export function Repacking() {
    const [[nomenclatures]] = useGet<TreeDataItem[]>(
        `${api.nomenclatures}/hierarchy`,
        [],
    )
    const [[tareTypes]] = useGet<TreeDataItem[]>(
        `${api.taretypes}/hierarchy`,
        [],
    )

    const [selectedNomenclatureId, setSelectedNomenclatureId] = useState<UUID>()

    const [[allowedRows]] = useGet<NomenclatureTareType[]>(
        selectedNomenclatureId
            ? `${api.nomenclatures}/${selectedNomenclatureId}/taretypes`
            : '',
        [selectedNomenclatureId],
    )
    const allowedTareTypeIds = useMemo(
        () =>
            selectedNomenclatureId && allowedRows
                ? new Set<UUID>(allowedRows.map((r) => r.tareTypeId))
                : null,
        [selectedNomenclatureId, allowedRows],
    )
    const tareTypeOptions = useMemo(
        () =>
            allowedTareTypeIds
                ? pruneHierarchy(tareTypes, allowedTareTypeIds)
                : (tareTypes ?? []),
        [tareTypes, allowedTareTypeIds],
    )

    const [sourceItems, setSourceItems] = useState<Item[]>([])

    // Multi-select source items: plain click → single, Ctrl/Cmd+click →
    // toggle, Shift+click within the same tare → range. Click on an empty
    // target slot then places the selected items starting at that address.
    // The shared workspace hook owns selection, target-tare bookkeeping,
    // pending-moves, and context-menu state so Repacking and Allocate can't
    // drift; `onItemConsumed` drops the item from this screen's local pool
    // (Repacking's source isn't server-managed).
    const {
        selected: selectedSourceItemIds,
        handleSlotClick: onSourceItemClick,
        clear: clearSourceSelection,
        selectByPredicate,
        targetTares,
        addTargetTare: addTargetTareToWorkspace,
        removeTargetTare: removeTargetTareFromWorkspace,
        updateTargetTares,
        expandedTareIds: expandedTarget,
        toggleTareExpanded: toggleExpandedTarget,
        pending,
        distribute,
        placeAt,
        reset: resetTransfer,
        clearPending,
        pendingTargetSlot: selectedTargetSlot,
        setPendingTargetSlot: setSelectedTargetSlot,
        ctxMenu,
        openContextMenu,
        closeContextMenu,
        ctxEligibleIds,
    } = useTareTransfer<Item>({
        sourceItems,
        itemScopeKey: (i) => i.tareId || i.tareBarcode || 'no-tare',
        // Don't drop items from sourceItems on move. The hook clones them
        // into the target tare with the new address and leaves the original
        // item (with its original address) in place. Source-side rendering
        // hides items that are in `pending`, so a Reset just needs to clear
        // pending — items reappear at their real slots automatically.
    })

    // Single state for each picker — the picker emits an AvailableTare-like
    // object (with `.id` for an existing pick, only `.barcode` for a typed
    // custom value). Derive the barcode string from that.
    const [tarePicked, setTarePicked] = useState<AvailableTare | null>(null)
    const [newTarePicked, setNewTarePicked] = useState<AvailableTare | null>(
        null,
    )
    const [newTareTypeId, setNewTareTypeId] = useState<UUID>()

    const tareBarcode = tarePicked?.barcode ?? ''
    const newTareBarcode = newTarePicked?.barcode ?? ''

    // Selected nomenclature's default tare type narrows the source picker's
    // dropdown to tares of that type — purely a search hint. The operator
    // is still free to type or pick any other barcode; whatever they pick
    // is added to the source pool unfiltered.
    const sourceSuggestionTareTypeId = useMemo(
        () =>
            (
                findInHierarchy(
                    nomenclatures,
                    selectedNomenclatureId,
                ) as Nomenclature | null
            )?.defaultTareTypeId,
        [nomenclatures, selectedNomenclatureId],
    )

    const [submitResult, setSubmitResult] = useState<RepackResult>()
    const [submitting, setSubmitting] = useState(false)

    // Source-side expansion is screen-local (the hook only tracks target
    // tares — source tares are derived from sourceItems on every render).
    const [expandedSource, setExpandedSource] = useState<Set<string>>(new Set())

    const toggleExpandedSource = (key: string) =>
        setExpandedSource((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })

    // Drop a source tare from the visible pool — only the items that are
    // still un-moved are removed; pending-moved items stay in `sourceItems`
    // so they can flow back here on Reset (and their target-tare clones
    // stay visible meanwhile).
    const removeSourceTare = (tareKey: string) => {
        setSourceItems((prev) =>
            prev.filter((i) => {
                const itemTareKey =
                    i.tareId || i.tareBarcode || 'no-tare'
                if (itemTareKey !== tareKey) return true
                return pendingItemIds.has(i.id)
            }),
        )
        // Selection auto-prunes — useSlotSelection drops ids no longer in `items`.
        setExpandedSource((prev) => {
            if (!prev.has(tareKey)) return prev
            const next = new Set(prev)
            next.delete(tareKey)
            return next
        })
    }

    useEffect(() => {
        if (
            allowedTareTypeIds &&
            newTareTypeId &&
            !allowedTareTypeIds.has(newTareTypeId)
        ) {
            setNewTareTypeId(undefined)
        }
    }, [allowedTareTypeIds, newTareTypeId])

    // Seed the type picker with the nomenclature's default tare type once
    // its allowed-list has loaded. Tracked per-nomenclature so an explicit
    // user choice (or clear) afterwards isn't reverted on re-renders, but a
    // switch to a different nomenclature re-seeds. Mirrors Allocate.
    const seededForRef = useRef<UUID | null>(null)
    useEffect(() => {
        if (!selectedNomenclatureId || !allowedRows) return
        if (seededForRef.current === selectedNomenclatureId) return
        seededForRef.current = selectedNomenclatureId
        const def = allowedRows.find((r) => r.isDefault)
        if (def) setNewTareTypeId(def.tareTypeId)
    }, [selectedNomenclatureId, allowedRows])

    const loadTareByBarcode = useCallback(async () => {
        if (!tareBarcode.trim()) return
        try {
            const tares = await getData<TareInfo[]>(
                `${api.tares}/search?barcode=${encodeURIComponent(tareBarcode.trim())}`,
            )
            if (tares && tares.length > 0) {
                const tare = tares[0]
                const items = await getData<Item[]>(
                    `${api.items}/tare/${tare.id}`,
                )
                // Add every item from the picked tare — nomenclature is
                // only a search hint, not a filter on the contents.
                setSourceItems((prev) => {
                    const existing = new Set(prev.map((i) => i.id))
                    const additions = (items || []).filter(
                        (i) => !existing.has(i.id),
                    )
                    return [...prev, ...additions]
                })
                // Open the new tare row by default.
                const key = tare.id || tare.barcode || 'no-tare'
                setExpandedSource((prev) => new Set(prev).add(key))
            }
        } catch {
            /* ignore */
        }
    }, [tareBarcode])

    const pendingItemIds = useMemo(
        () => new Set(pending.map((p) => p.itemId)),
        [pending],
    )

    /** Items currently visible in the source pool — pending-moved items
     *  stay in `sourceItems` (with their original address) but are hidden
     *  from the source rendering until Apply or Reset. The owning source
     *  tare row stays visible even when all of its items are pending, so
     *  the operator can see what they moved out of. */
    const visibleSourceItems = useMemo(
        () => sourceItems.filter((i) => !pendingItemIds.has(i.id)),
        [sourceItems, pendingItemIds],
    )

    const sourceTares = useMemo(() => {
        const map = new Map<string, { tare: TareInfo; items: Item[] }>()
        // Walk every source item (incl. pending) so a tare keeps its row
        // even when all of its items have been moved out. Only visible
        // (non-pending) items are pushed into the row's `items` list.
        for (const item of sourceItems) {
            if (!item.tareBarcode) continue
            const tareKey = item.tareBarcode
            if (!map.has(tareKey)) {
                map.set(tareKey, {
                    tare: {
                        id: (item as any).tareId || ('' as UUID),
                        barcode: item.tareBarcode,
                        tareTypeId: item.tareTareTypeId || ('' as UUID),
                        tareTypeName: item.tareTareTypeName,
                        tareTypeUnits: item.tareTareTypeUnits,
                        sizeX: item.tareTareTypeSizeX,
                        sizeY: item.tareTareTypeSizeY,
                        sizeZ: item.tareTareTypeSizeZ,
                        dimensions: item.tareTareTypeDimensions ?? 1,
                        capacity:
                            item.tareTareTypeCapacity ||
                            sourceItems.filter(
                                (i) => i.tareBarcode === tareKey,
                            ).length,
                    },
                    items: [],
                })
            }
            if (!pendingItemIds.has(item.id)) {
                map.get(tareKey)!.items.push(item)
            }
        }
        return Array.from(map.values())
    }, [sourceItems, pendingItemIds])

    const handleSourceSlotClick = (
        group: { tare: TareInfo; items: Item[] },
        slot: SlotData,
        e: React.MouseEvent,
    ) => {
        if (!slot.item) return
        const tareKey = group.tare.id || group.tare.barcode || 'no-tare'
        onSourceItemClick(slot.item, e, tareKey)
    }

    const handleTargetSlotClick = (tareId: UUID, slot: SlotData) => {
        if (slot.item) return
        if (selectedSourceItemIds.size === 0) {
            setSelectedTargetSlot({ tareId, address: slot.address })
            return
        }
        placeAt(tareId, slot.address)
    }

    const autoFill = () => distribute(visibleSourceItems.map((i) => i.id))

    const selectByGrade = (gradeId: UUID | null) =>
        selectByPredicate((i) => (i.gradeId ?? null) === gradeId)
    const selectByNomenclature = (nomenclatureId: UUID) =>
        selectByPredicate((i) => i.nomenclatureId === nomenclatureId)

    const ctxTareOptions = useMemo<ContextTareOption[]>(
        () =>
            targetTares.map((t) => ({
                ...t,
                occupied: t.items.length,
                capacity: Math.floor(t.capacity),
            })),
        [targetTares],
    )

    const onCtxAutofill = () => {
        distribute(ctxEligibleIds)
        closeContextMenu()
    }
    const onCtxFillTare = (tareId: UUID) => {
        distribute(ctxEligibleIds, tareId)
        closeContextMenu()
    }

    const addTargetTare = async (existing?: TareInfo) => {
        if (existing) {
            if (targetTares.some((t) => t.id === existing.id)) return
            const items = await getData<Item[]>(
                `${api.items}/tare/${existing.id}`,
            )
            addTargetTareToWorkspace(existing, items || [])
            return
        }

        const text = newTareBarcode.trim()
        if (!newTareTypeId || !text) return
        try {
            const created = await postData<TareInfo>(`${api.tares}`, {
                barcode: text,
                tareTypeId: newTareTypeId,
            })
            if (created) {
                addTargetTareToWorkspace(created, [])
                setNewTarePicked(null)
            }
        } catch (e: any) {
            alert(e.message || 'Failed to create tare')
        }
    }

    const searchAndAddTare = async () => {
        // Existing pick from the dropdown — short-circuit.
        if (newTarePicked?.id) {
            await addTargetTare(newTarePicked)
            setNewTarePicked(null)
            return
        }
        const text = newTareBarcode.trim()
        if (!text) return
        try {
            const tares = await getData<TareInfo[]>(
                `${api.tares}/search?barcode=${encodeURIComponent(text)}`,
            )
            if (tares && tares.length > 0) {
                await addTargetTare(tares[0])
                setNewTarePicked(null)
            } else if (newTareTypeId) {
                await addTargetTare()
            } else {
                alert('Tare not found. Select a tare type to create a new one.')
            }
        } catch {
            alert('Failed to search tare')
        }
    }

    /** Wrap the hook's removeTargetTare so any pending-moved items in this
     *  tare flow back into the local source pool — Repacking moves remove
     *  items from `sourceItems` (unlike Allocate where they stay in the
     *  server-managed unallocated list). */
    const removeTargetTare = (tareId: UUID) => {
        const tare = targetTares.find((t) => t.id === tareId)
        const movedBackItems =
            tare?.items.filter((i) =>
                pending.some((m) => m.itemId === i.id),
            ) ?? []
        if (movedBackItems.length > 0) {
            setSourceItems((prev) => [...prev, ...movedBackItems])
        }
        removeTargetTareFromWorkspace(tareId)
    }

    const submitRepack = async () => {
        if (!selectedNomenclatureId || pending.length === 0) return
        setSubmitting(true)
        try {
            // Build RepackMove[] from the hook's generic pending records.
            // Each pending entry's item now lives under its target tare —
            // pull `quantity` from there since moved items have already
            // left `sourceItems`.
            const tareById = new Map(targetTares.map((t) => [t.id, t]))
            const moves: RepackMove[] = pending.map((m) => {
                const item = tareById.get(m.targetTareId)?.items.find(
                    (i) => i.id === m.itemId,
                )
                return {
                    sourceItemId: m.itemId,
                    targetTareId: m.targetTareId,
                    targetAddress: m.address,
                    quantity: item?.quantity ?? 0,
                }
            })
            const request: RepackRequest = {
                nomenclatureId: selectedNomenclatureId,
                moves,
            }
            const result = await postData<RepackResult>(
                `${api.items}/repack`,
                request,
            )
            setSubmitResult(result)
            if (result.errors.length === 0) {
                clearPending()
                // Source pool is operator-driven — clear it and let the
                // user re-pick tares for the next round.
                setSourceItems([])
                const refreshed = await Promise.all(
                    targetTares.map(async (t) => {
                        const items = await getData<Item[]>(
                            `${api.items}/tare/${t.id}`,
                        )
                        return { ...t, items: items || [] }
                    }),
                )
                updateTargetTares(() => refreshed)
            }
        } catch (e: any) {
            setSubmitResult({
                movedCount: 0,
                movedQuantity: 0,
                countable: false,
                errors: [e.message || 'Request failed'],
            })
        }
        setSubmitting(false)
    }

    const reset = () => {
        setSubmitResult(undefined)
        // sourceItems is untouched by moves now (option-A model), so
        // resetTransfer() alone is enough: it clears pending + selection
        // and rolls the pending items out of target tares' visible items.
        // The original source items reappear at their original addresses.
        resetTransfer()
    }

    const selectedNomenclature = findInHierarchy(
        nomenclatures,
        selectedNomenclatureId,
    ) as Nomenclature | null

    const selectedSourceItems = useMemo(
        () => sourceItems.filter((i) => selectedSourceItemIds.has(i.id)),
        [sourceItems, selectedSourceItemIds],
    )

    const selectedSourceTotals = useMemo(() => {
        let qty = 0
        let units: string | undefined
        for (const item of selectedSourceItems) {
            qty += item.quantity ?? 0
            units ??= item.tareTareTypeUnits
        }
        return { qty, units }
    }, [selectedSourceItems])

    const selectionLabel = useMemo(() => {
        if (selectedSourceItems.length === 0) return null
        const { nomenclatureNames, gradeNames } = selectionSummary(
            selectedSourceItems,
        )
        const amount = formatUnits(
            selectedSourceTotals.qty,
            selectedSourceTotals.units,
            selectedNomenclature?.countable,
        )
        const segments = [amount]
        if (nomenclatureNames.length > 0)
            segments.push(nomenclatureNames.join(', '))
        if (gradeNames.length > 0) segments.push(gradeNames.join(', '))
        return segments.join(' · ')
    }, [selectedSourceItems, selectedSourceTotals, selectedNomenclature])

    return (
        <div className="repacking-page">
            <PageTitle title="Repacking" />
            <hr />

            <SmartScroll
                offsetTop={10}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 20,
                }}
            >
                <SmartScrollContent style={{ flex: 1 }}>
                    <div className="column-toolbar">
                        <div className="field-group">
                            <label>Search source tare by barcode</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <TareBarcodePicker
                                    tareTypeId={sourceSuggestionTareTypeId}
                                    nomenclatureId={selectedNomenclatureId}
                                    includeFull
                                    value={tarePicked}
                                    onChange={async (tare) => {
                                        setTarePicked(tare)
                                        if (!tare?.id) return
                                        try {
                                            const items = await getData<
                                                Item[]
                                            >(`${api.items}/tare/${tare.id}`)
                                            setSourceItems((prev) => {
                                                const existing = new Set(
                                                    prev.map((i) => i.id),
                                                )
                                                const additions = (
                                                    items || []
                                                ).filter(
                                                    (i) => !existing.has(i.id),
                                                )
                                                return [...additions, ...prev]
                                            })
                                            const key =
                                                tare.id ||
                                                tare.barcode ||
                                                'no-tare'
                                            setExpandedSource((prev) =>
                                                new Set(prev).add(key),
                                            )
                                        } catch {
                                            /* ignore */
                                        }
                                    }}
                                    placeholder="Scan or type barcode…"
                                    style={{ width: 240 }}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={loadTareByBarcode}
                                    disabled={!tareBarcode.trim()}
                                >
                                    Find
                                </Button>
                            </div>
                        </div>
                        <div className="field-group">
                            <label>Nomenclature</label>
                            <HierarchyPicker
                                data={nomenclatures}
                                value={selectedNomenclatureId}
                                onChange={setSelectedNomenclatureId}
                                width={300}
                                placeholder="Select nomenclature..."
                            />
                        </div>
                    </div>
                    <div className="repacking-panel source">
                        <h3>Source tares</h3>
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                columnGap: '1rem',
                                rowGap: '0.25rem',
                                margin: '0.25rem 0 0.5rem',
                            }}
                        >
                            <GradeLegend
                                grades={visibleGrades(sourceItems)}
                                onPick={selectByGrade}
                            />
                            <NomenclatureLegend
                                nomenclatures={visibleNomenclatures(sourceItems)}
                                onPick={selectByNomenclature}
                            />
                            {selectionLabel && (
                                <span
                                    title="Click an empty target slot to place. Shift+click for range, Ctrl/Cmd+click to toggle. Right-click for more."
                                    style={{
                                        fontSize: '0.85rem',
                                        color: '#1976d2',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    {selectionLabel}
                                </span>
                            )}
                        </div>
                        {sourceTares.length === 0 && (
                            <div className="no-items-message">
                                {selectedNomenclatureId
                                    ? 'Pick or scan a tare to add its matching items here.'
                                    : 'Select a nomenclature, then pick a tare to load its items.'}
                            </div>
                        )}
                        {sourceTares.map(({ tare, items }) => {
                            const key = tare.id || tare.barcode || 'no-tare'
                            const expanded = expandedSource.has(key)
                            const selectedSlots = new Set(
                                items
                                    .filter((i) =>
                                        selectedSourceItemIds.has(i.id),
                                    )
                                    .map((i) => i.address)
                                    .filter(
                                        (a): a is number => a != null,
                                    ),
                            )
                            return (
                                <TareGroupRow
                                    key={key}
                                    group={{ tare, items }}
                                    expanded={expanded}
                                    onToggleExpanded={() =>
                                        toggleExpandedSource(key)
                                    }
                                    selectedSlots={selectedSlots}
                                    onSlotClick={(slot, e) =>
                                        handleSourceSlotClick(
                                            { tare, items },
                                            slot,
                                            e,
                                        )
                                    }
                                    onSlotContextMenu={(slot, e) => {
                                        if (slot.item) {
                                            openContextMenu(slot.item, e)
                                        }
                                    }}
                                    headerExtra={
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                                removeSourceTare(key)
                                            }
                                        >
                                            Remove
                                        </Button>
                                    }
                                />
                            )
                        })}
                    </div>
                </SmartScrollContent>

                <SmartScrollContent style={{ flex: 1 }}>
                    <div className="column-toolbar">
                        <div className="field-group">
                            <label>Add target tare</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <TareBarcodePicker
                                    tareTypeId={newTareTypeId}
                                    nomenclatureId={selectedNomenclatureId}
                                    value={newTarePicked}
                                    onChange={async (tare) => {
                                        setNewTarePicked(tare)
                                        // When the user picks an existing
                                        // tare (has `.id`), auto-add it as
                                        // a target — no need to also press
                                        // "Add tare". Custom-typed values
                                        // still go through the Add tare
                                        // button so the operator confirms
                                        // creation. Keep the picker showing
                                        // the just-picked barcode so the
                                        // operator sees what was added.
                                        if (!tare?.id) return
                                        await addTargetTare(tare)
                                    }}
                                    placeholder="Tare barcode…"
                                    style={{ width: 220 }}
                                />
                                <HierarchyPicker
                                    data={tareTypeOptions}
                                    value={newTareTypeId}
                                    onChange={setNewTareTypeId}
                                    width={200}
                                    placeholder="Type (for new)..."
                                />
                                <Button
                                    variant="contained"
                                    onClick={searchAndAddTare}
                                >
                                    Add tare
                                </Button>
                            </div>
                        </div>
                        <div className="repacking-actions">
                            <Button
                                variant="contained"
                                color="info"
                                onClick={autoFill}
                                disabled={
                                    sourceItems.length === 0 ||
                                    targetTares.length === 0
                                }
                            >
                                Auto-fill
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={submitRepack}
                                disabled={
                                    pending.length === 0 || submitting
                                }
                            >
                                {submitting
                                    ? 'Saving...'
                                    : `Apply (${pending.length} moves)`}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={reset}
                                disabled={pending.length === 0}
                            >
                                Reset
                            </Button>
                            {submitResult &&
                                (submitResult.errors.length === 0 ? (
                                    <span
                                        style={{
                                            color: '#388e3c',
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        Moved{' '}
                                        {formatUnits(
                                            submitResult.movedQuantity,
                                            submitResult.units,
                                            submitResult.countable,
                                        )}
                                        .
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            color: '#d32f2f',
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {submitResult.errors[0]}
                                    </span>
                                ))}
                        </div>
                    </div>
                    <div className="repacking-panel target">
                        <h3>Target tares</h3>
                        {targetTares.length === 0 && (
                            <div className="no-items-message">
                                Add target tares by barcode search or create new
                                ones
                            </div>
                        )}
                        {targetTares.map((t) => {
                            const key = t.id
                            const expanded = expandedTarget.has(key)
                            return (
                                <TareGroupRow
                                    key={key}
                                    group={{ tare: t, items: t.items }}
                                    expanded={expanded}
                                    onToggleExpanded={() =>
                                        toggleExpandedTarget(key)
                                    }
                                    highlightEmpty
                                    onSlotClick={(slot) =>
                                        handleTargetSlotClick(t.id, slot)
                                    }
                                    selectedSlot={
                                        selectedTargetSlot?.tareId === t.id
                                            ? selectedTargetSlot.address
                                            : undefined
                                    }
                                    mutedItem={(item) =>
                                        pendingItemIds.has(item.id)
                                    }
                                    headerExtra={
                                        <Button
                                            size="small"
                                            fillMode="flat"
                                            onClick={() =>
                                                removeTargetTare(t.id)
                                            }
                                        >
                                            Remove
                                        </Button>
                                    }
                                />
                            )
                        })}
                    </div>
                </SmartScrollContent>
            </SmartScroll>
            {ctxMenu && (
                <TransferContextMenu
                    x={ctxMenu.x}
                    y={ctxMenu.y}
                    tares={ctxTareOptions}
                    targetCount={ctxEligibleIds.length}
                    canAutofill={
                        targetTares.length > 0 && ctxEligibleIds.length > 0
                    }
                    onAutofillAll={onCtxAutofill}
                    onFillTare={onCtxFillTare}
                    onClose={closeContextMenu}
                />
            )}
        </div>
    )
}
