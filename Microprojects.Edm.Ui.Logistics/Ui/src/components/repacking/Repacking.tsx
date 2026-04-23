import api from '@features/api/api'
import { PageTitle } from '@logistics/components/PageTitle'
import { TareBarcodePicker } from '@logistics/components/tare/TareBarcodePicker'
import { TareGroupRow } from '@logistics/components/tare/TareGroupRow'
import {
    type SlotData,
    TareSchematic,
} from '@logistics/components/tare/TareSchematic'
import type {
    AvailableTare,
    Item,
    Nomenclature,
    RepackMove,
    RepackRequest,
    RepackResult,
    TareInfo,
    TareType,
    UUID,
} from '@logistics/data/types'
import { getData, postData, useGet } from '@logistics/hooks/hooks'
import { SmartScroll, SmartScrollContent } from '@microprojects/tools'
import { Button } from '@progress/kendo-react-buttons'
import {
    ComboBox,
    type ComboBoxFilterChangeEvent,
} from '@progress/kendo-react-dropdowns'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './Repacking.css'

type TargetTareState = TareInfo & {
    items: Item[]
}

export function Repacking() {
    const [[nomenclatures]] = useGet<Nomenclature[]>(api.nomenclatures, [])
    const [[tareTypes]] = useGet<TareType[]>(api.taretypes, [])

    const [selectedNomenclatureId, setSelectedNomenclatureId] = useState<UUID>()
    const [nomenclatureFilter, setNomenclatureFilter] = useState('')

    const [sourceItems, setSourceItems] = useState<Item[]>([])

    const [targetTares, setTargetTares] = useState<TargetTareState[]>([])
    // Multi-select source items: plain click → single, Ctrl/Cmd+click →
    // toggle, Shift+click within the same tare → range. Click on an empty
    // target slot then places the selected items starting at that address.
    const [selectedSourceItemIds, setSelectedSourceItemIds] = useState<Set<UUID>>(new Set())
    const lastSourceClickRef = useRef<{
        tareKey: string
        itemId: UUID
    } | null>(null)
    const [selectedTargetSlot, setSelectedTargetSlot] = useState<{
        tareId: UUID
        address: number
    }>()

    // Single state for each picker — the picker emits an AvailableTare-like
    // object (with `.id` for an existing pick, only `.barcode` for a typed
    // custom value). Derive the barcode string from that.
    const [tarePicked, setTarePicked] = useState<AvailableTare | null>(null)
    const [newTarePicked, setNewTarePicked] = useState<AvailableTare | null>(
        null,
    )
    const [newTareTypeId, setNewTareTypeId] = useState<UUID>()
    const [tareTypeFilter, setTareTypeFilter] = useState('')

    const tareBarcode = tarePicked?.barcode ?? ''
    const newTareBarcode = newTarePicked?.barcode ?? ''

    // Selected nomenclature's default tare type narrows the source picker's
    // dropdown to tares of that type — purely a search hint. The operator
    // is still free to type or pick any other barcode; whatever they pick
    // is added to the source pool unfiltered.
    const sourceSuggestionTareTypeId = useMemo(
        () => nomenclatures?.find((n) => n.id === selectedNomenclatureId)
            ?.defaultTareTypeId,
        [nomenclatures, selectedNomenclatureId],
    )

    const [pendingMoves, setPendingMoves] = useState<RepackMove[]>([])
    const [submitResult, setSubmitResult] = useState<RepackResult>()
    const [submitting, setSubmitting] = useState(false)

    // Expand/collapse state per source/target tare — same pattern as
    // TareItemsPanel.
    const [expandedSource, setExpandedSource] = useState<Set<string>>(new Set())
    const [expandedTarget, setExpandedTarget] = useState<Set<string>>(new Set())

    const toggleExpandedSource = (key: string) =>
        setExpandedSource((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })

    const toggleExpandedTarget = (key: string) =>
        setExpandedTarget((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })

    // Drop a source tare from the visible pool — only the items that are
    // still un-moved are removed; any pendingMoves already taken from that
    // tare stay (their items are now displayed under their target tare).
    const removeSourceTare = (tareKey: string) => {
        setSourceItems((prev) =>
            prev.filter(
                (i) => (i.tareId || i.tareBarcode || 'no-tare') !== tareKey,
            ),
        )
        // Drop any selection that pointed at items in the removed tare.
        setSelectedSourceItemIds((prev) => {
            const stillHere = new Set(
                sourceItems
                    .filter(
                        (i) =>
                            (i.tareId || i.tareBarcode || 'no-tare') !==
                                tareKey && prev.has(i.id),
                    )
                    .map((i) => i.id),
            )
            return stillHere
        })
        setExpandedSource((prev) => {
            if (!prev.has(tareKey)) return prev
            const next = new Set(prev)
            next.delete(tareKey)
            return next
        })
    }

    const filteredNomenclatures = useMemo(() => {
        if (!nomenclatures) return []
        if (!nomenclatureFilter) return nomenclatures
        const lc = nomenclatureFilter.toLowerCase()
        return nomenclatures.filter((n) => n.name.toLowerCase().includes(lc))
    }, [nomenclatures, nomenclatureFilter])

    const filteredTareTypes = useMemo(() => {
        if (!tareTypes) return []
        if (!tareTypeFilter) return tareTypes
        const lc = tareTypeFilter.toLowerCase()
        return tareTypes.filter((t) => t.name.toLowerCase().includes(lc))
    }, [tareTypes, tareTypeFilter])

    // The Nomenclature combo is a *helper* — it identifies which kind of
    // item the operator wants to relocate so the source pool can ignore
    // unrelated items in a picked tare. It does NOT pre-populate the
    // source pool: the operator picks tares explicitly via the source
    // picker (or the Find button) and only matching items are added.
    // Whenever the helper changes, drop the current source items so the
    // pool reflects the new context.
    useEffect(() => {
        setSourceItems([])
        setSelectedSourceItemIds(new Set())
    }, [selectedNomenclatureId])

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

    const sourceTares = useMemo(() => {
        const map = new Map<string, { tare: TareInfo; items: Item[] }>()
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
                            sourceItems.filter((i) => i.tareBarcode === tareKey)
                                .length,
                    },
                    items: [],
                })
            }
            map.get(tareKey)!.items.push(item)
        }
        return Array.from(map.values())
    }, [sourceItems])

    const handleSourceSlotClick = (
        group: { tare: TareInfo; items: Item[] },
        slot: SlotData,
        e: React.MouseEvent,
    ) => {
        if (!slot.item) return
        const itemId = slot.item.id
        const tareKey = group.tare.id || group.tare.barcode || 'no-tare'

        // Shift+click extends the range from the last clicked slot in the
        // same tare. Mirrors ItemSearch.handleSlotSelect.
        if (
            e.shiftKey &&
            lastSourceClickRef.current &&
            lastSourceClickRef.current.tareKey === tareKey
        ) {
            const sorted = [...group.items]
                .filter((i) => i.address != null)
                .sort((a, b) => (a.address ?? 0) - (b.address ?? 0))
            const lastIdx = sorted.findIndex(
                (i) => i.id === lastSourceClickRef.current?.itemId,
            )
            const curIdx = sorted.findIndex((i) => i.id === itemId)
            if (lastIdx >= 0 && curIdx >= 0) {
                const lo = Math.min(lastIdx, curIdx)
                const hi = Math.max(lastIdx, curIdx)
                setSelectedSourceItemIds((prev) => {
                    const next = new Set(prev)
                    for (let i = lo; i <= hi; i++) next.add(sorted[i].id)
                    return next
                })
                lastSourceClickRef.current = { tareKey, itemId }
                return
            }
        }

        // Ctrl/Cmd+click toggles selection without dropping the rest.
        if (e.ctrlKey || e.metaKey) {
            setSelectedSourceItemIds((prev) => {
                const next = new Set(prev)
                if (next.has(itemId)) next.delete(itemId)
                else next.add(itemId)
                return next
            })
        } else {
            // Plain click — single select (toggle off if it's the only one
            // already selected).
            setSelectedSourceItemIds((prev) => {
                if (prev.size === 1 && prev.has(itemId)) return new Set()
                return new Set([itemId])
            })
        }
        lastSourceClickRef.current = { tareKey, itemId }
    }

    const handleTargetSlotClick = (tareId: UUID, slot: SlotData) => {
        if (slot.item) return
        if (selectedSourceItemIds.size === 0) {
            setSelectedTargetSlot({ tareId, address: slot.address })
            return
        }
        moveSelectedItemsTo(tareId, slot.address)
    }

    /** Place every currently-selected source item into the target tare,
     *  starting at `startAddress` and skipping already-occupied slots. */
    const moveSelectedItemsTo = (
        targetTareId: UUID,
        startAddress: number,
    ) => {
        const target = targetTares.find((t) => t.id === targetTareId)
        if (!target) return

        // Items in click-order: derived from sourceItems by address.
        const itemsToPlace = sourceItems
            .filter((i) => selectedSourceItemIds.has(i.id))
            .sort((a, b) => (a.address ?? 0) - (b.address ?? 0))
        if (itemsToPlace.length === 0) return

        const occupied = new Set(target.items.map((i) => i.address))
        const cap = Math.floor(target.capacity)
        const placed: { item: Item; address: number }[] = []
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
        const newMoves: RepackMove[] = placed.map(({ item, address }) => ({
            sourceItemId: item.id,
            targetTareId,
            targetAddress: address,
            quantity: item.quantity,
        }))

        setPendingMoves((prev) => [
            ...prev.filter((m) => !placedIds.has(m.sourceItemId)),
            ...newMoves,
        ])
        setSourceItems((prev) => prev.filter((i) => !placedIds.has(i.id)))
        setTargetTares((prev) =>
            prev.map((t) =>
                t.id !== targetTareId
                    ? t
                    : {
                          ...t,
                          items: [
                              ...t.items,
                              ...placed.map(({ item, address }) => ({
                                  ...item,
                                  address,
                              })),
                          ],
                      },
            ),
        )
        setSelectedSourceItemIds(new Set())
        setSelectedTargetSlot(undefined)
        lastSourceClickRef.current = null
    }

    const autoFill = () => {
        if (targetTares.length === 0 || sourceItems.length === 0) return

        const remaining = [...sourceItems]
        const newMoves: RepackMove[] = [...pendingMoves]
        const updatedTargets = targetTares.map((t) => {
            const capacity = Math.floor(t.capacity)
            const occupiedAddresses = new Set(t.items.map((i) => i.address))
            const newItems = [...t.items]

            for (
                let addr = 1;
                addr <= capacity && remaining.length > 0;
                addr++
            ) {
                if (occupiedAddresses.has(addr)) continue
                const item = remaining.shift()!
                newItems.push({ ...item, address: addr })
                newMoves.push({
                    sourceItemId: item.id,
                    targetTareId: t.id,
                    targetAddress: addr,
                    quantity: item.quantity,
                })
            }
            return { ...t, items: newItems }
        })

        setPendingMoves(newMoves)
        setSourceItems(remaining)
        setTargetTares(updatedTargets)
    }

    const addTargetTare = async (existing?: TareInfo) => {
        if (existing) {
            if (targetTares.some((t) => t.id === existing.id)) return
            const items = await getData<Item[]>(
                `${api.items}/tare/${existing.id}`,
            )
            setTargetTares((prev) => [
                ...prev,
                { ...existing, items: items || [] },
            ])
            // Newly added tares open by default so the operator sees the
            // schematic without an extra click.
            setExpandedTarget((prev) => new Set(prev).add(existing.id))
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
                setTargetTares((prev) => [...prev, { ...created, items: [] }])
                setExpandedTarget((prev) => new Set(prev).add(created.id))
                setNewTarePicked(null)
                setNewTareTypeId(undefined)
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

    const removeTargetTare = (tareId: UUID) => {
        const tare = targetTares.find((t) => t.id === tareId)
        if (!tare) return
        const movedBackItems = tare.items.filter((i) =>
            pendingMoves.some((m) => m.sourceItemId === i.id),
        )
        setSourceItems((prev) => [...prev, ...movedBackItems])
        setPendingMoves((prev) => prev.filter((m) => m.targetTareId !== tareId))
        setTargetTares((prev) => prev.filter((t) => t.id !== tareId))
    }

    const submitRepack = async () => {
        if (!selectedNomenclatureId || pendingMoves.length === 0) return
        setSubmitting(true)
        try {
            const request: RepackRequest = {
                nomenclatureId: selectedNomenclatureId,
                moves: pendingMoves,
            }
            const result = await postData<RepackResult>(
                `${api.items}/repack`,
                request,
            )
            setSubmitResult(result)
            if (result.errors.length === 0) {
                setPendingMoves([])
                // Source pool is operator-driven now — clear it and let
                // the user re-pick tares for the next round.
                setSourceItems([])
                const refreshed: TargetTareState[] = []
                for (const t of targetTares) {
                    const items = await getData<Item[]>(
                        `${api.items}/tare/${t.id}`,
                    )
                    refreshed.push({ ...t, items: items || [] })
                }
                setTargetTares(refreshed)
            }
        } catch (e: any) {
            setSubmitResult({
                movedCount: 0,
                errors: [e.message || 'Request failed'],
            })
        }
        setSubmitting(false)
    }

    const reset = () => {
        setPendingMoves([])
        setSubmitResult(undefined)
        setSelectedSourceItemIds(new Set())
        setSelectedTargetSlot(undefined)
        setTargetTares([])
        setSourceItems([])
    }

    const selectedNomenclature = nomenclatures?.find(
        (n) => n.id === selectedNomenclatureId,
    )

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
                                    onClick={loadTareByBarcode}
                                    disabled={!selectedNomenclatureId}
                                >
                                    Find
                                </Button>
                            </div>
                        </div>
                        <div className="field-group">
                            <label>Nomenclature</label>
                            <ComboBox
                                data={filteredNomenclatures}
                                dataItemKey="id"
                                textField="name"
                                value={selectedNomenclature || null}
                                filterable
                                onFilterChange={(
                                    e: ComboBoxFilterChangeEvent,
                                ) =>
                                    setNomenclatureFilter(e.filter?.value || '')
                                }
                                onChange={(e) => {
                                    setSelectedNomenclatureId(e.value?.id)
                                    reset()
                                }}
                                style={{ width: 300 }}
                                placeholder="Select nomenclature..."
                            />
                        </div>
                    </div>
                    <div className="repacking-panel source">
                        <h3>Source tares</h3>
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
                                    headerExtra={
                                        <Button
                                            size="small"
                                            fillMode="flat"
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
                        {selectedSourceItemIds.size > 0 && (
                            <div
                                style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.85rem',
                                    color: '#1976d2',
                                }}
                            >
                                {selectedSourceItemIds.size} item(s) selected
                                — click an empty target slot to place them
                                (Shift+click for range, Ctrl/Cmd+click to
                                toggle).
                            </div>
                        )}
                    </div>
                </SmartScrollContent>

                <SmartScrollContent style={{ flex: 1 }}>
                    <div className="column-toolbar">
                        <div className="field-group">
                            <label>Add target tare</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <TareBarcodePicker
                                    tareTypeId={newTareTypeId}
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
                                <ComboBox
                                    data={filteredTareTypes}
                                    dataItemKey="id"
                                    textField="name"
                                    value={
                                        tareTypes?.find(
                                            (t) => t.id === newTareTypeId,
                                        ) || null
                                    }
                                    filterable
                                    onFilterChange={(
                                        e: ComboBoxFilterChangeEvent,
                                    ) =>
                                        setTareTypeFilter(e.filter?.value || '')
                                    }
                                    onChange={(e) =>
                                        setNewTareTypeId(e.value?.id)
                                    }
                                    style={{ width: 200 }}
                                    placeholder="Type (for new)..."
                                />
                                <Button
                                    themeColor="primary"
                                    onClick={searchAndAddTare}
                                >
                                    Add tare
                                </Button>
                            </div>
                        </div>
                        <div className="repacking-actions">
                            <Button
                                themeColor="info"
                                onClick={autoFill}
                                disabled={
                                    sourceItems.length === 0 ||
                                    targetTares.length === 0
                                }
                            >
                                Auto-fill
                            </Button>
                            <Button
                                themeColor="success"
                                onClick={submitRepack}
                                disabled={
                                    pendingMoves.length === 0 || submitting
                                }
                            >
                                {submitting
                                    ? 'Saving...'
                                    : `Apply (${pendingMoves.length} moves)`}
                            </Button>
                            <Button
                                onClick={reset}
                                disabled={pendingMoves.length === 0}
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
                                        Moved {submitResult.movedCount} items.
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
        </div>
    )
}
