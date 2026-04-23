import api from '@features/api/api'
import { PageTitle } from '@logistics/components/PageTitle'
import { TareBarcodePicker } from '@logistics/components/tare/TareBarcodePicker'
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
import { useCallback, useEffect, useMemo, useState } from 'react'
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
    const [selectedSourceItem, setSelectedSourceItem] = useState<Item>()
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
        setSelectedSourceItem(undefined)
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

    const handleSourceSlotClick = (slot: SlotData, _e: React.MouseEvent) => {
        if (slot.item) {
            setSelectedSourceItem(slot.item)
        }
    }

    const handleTargetSlotClick = (tareId: UUID, slot: SlotData) => {
        if (!slot.item && selectedSourceItem) {
            moveItemToSlot(selectedSourceItem, tareId, slot.address)
        } else if (!slot.item) {
            setSelectedTargetSlot({ tareId, address: slot.address })
        }
    }

    const moveItemToSlot = (
        item: Item,
        targetTareId: UUID,
        targetAddress: number,
    ) => {
        const move: RepackMove = {
            sourceItemId: item.id,
            targetTareId,
            targetAddress,
            quantity: item.quantity,
        }
        setPendingMoves((prev) => [
            ...prev.filter((m) => m.sourceItemId !== item.id),
            move,
        ])

        setSourceItems((prev) => prev.filter((i) => i.id !== item.id))

        setTargetTares((prev) =>
            prev.map((t) => {
                if (t.id !== targetTareId) return t
                const movedItem: Item = { ...item, address: targetAddress }
                return { ...t, items: [...t.items, movedItem] }
            }),
        )

        setSelectedSourceItem(undefined)
        setSelectedTargetSlot(undefined)
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
        setSelectedSourceItem(undefined)
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
                        {sourceTares.map(({ tare, items }) => (
                            <TareSchematic
                                key={tare.barcode}
                                tare={tare}
                                items={items}
                                selectedSlot={
                                    selectedSourceItem &&
                                    items.some(
                                        (i) => i.id === selectedSourceItem.id,
                                    )
                                        ? selectedSourceItem.address
                                        : undefined
                                }
                                onSlotClick={handleSourceSlotClick}
                            />
                        ))}
                        {selectedSourceItem && (
                            <div
                                style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.85rem',
                                    color: '#1976d2',
                                }}
                            >
                                Selected:{' '}
                                {selectedSourceItem.serialNo ||
                                    selectedSourceItem.nomenclatureName}{' '}
                                (qty: {selectedSourceItem.quantity}) &mdash;
                                click an empty target slot to place it
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
                        {targetTares.map((t) => (
                            <div key={t.id} style={{ position: 'relative' }}>
                                <TareSchematic
                                    tare={t}
                                    items={t.items}
                                    highlightEmpty
                                    onSlotClick={(slot, _e) =>
                                        handleTargetSlotClick(t.id, slot)
                                    }
                                    selectedSlot={
                                        selectedTargetSlot?.tareId === t.id
                                            ? selectedTargetSlot.address
                                            : undefined
                                    }
                                />
                                <Button
                                    size="small"
                                    fillMode="flat"
                                    onClick={() => removeTargetTare(t.id)}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                </SmartScrollContent>
            </SmartScroll>
        </div>
    )
}
