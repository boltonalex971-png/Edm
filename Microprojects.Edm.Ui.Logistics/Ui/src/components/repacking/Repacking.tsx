import api from '@features/api/api'
import { PageTitle } from '@logistics/components/PageTitle'
import {
    type SlotData,
    TareSchematic,
} from '@logistics/components/tare/TareSchematic'
import type {
    Item,
    Nomenclature,
    RepackMove,
    RepackRequest,
    RepackResult,
    TareInfo,
    TareType,
    UUID,
} from '@logistics/data/types'
import { getData, postData, useGet, usePost } from '@logistics/hooks/hooks'
import { SmartScroll, SmartScrollContent } from '@microprojects/tools'
import { Button } from '@progress/kendo-react-buttons'
import {
    ComboBox,
    type ComboBoxFilterChangeEvent,
} from '@progress/kendo-react-dropdowns'
import { TextBox } from '@progress/kendo-react-inputs'
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
    const [tareBarcode, setTareBarcode] = useState('')
    const [nomenclatureFilter, setNomenclatureFilter] = useState('')

    const [sourceItems, setSourceItems] = useState<Item[]>([])
    const [sourceLoading, setSourceLoading] = useState(false)

    const [targetTares, setTargetTares] = useState<TargetTareState[]>([])
    const [selectedSourceItem, setSelectedSourceItem] = useState<Item>()
    const [selectedTargetSlot, setSelectedTargetSlot] = useState<{
        tareId: UUID
        address: number
    }>()

    const [newTareBarcode, setNewTareBarcode] = useState('')
    const [newTareTypeId, setNewTareTypeId] = useState<UUID>()
    const [tareTypeFilter, setTareTypeFilter] = useState('')

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

    const loadSourceItems = useCallback(async () => {
        if (!selectedNomenclatureId) {
            setSourceItems([])
            return
        }
        setSourceLoading(true)
        try {
            const query: any = {
                nomenclatureId: selectedNomenclatureId,
                active: true,
            }
            const items = await postData<Item[]>(`${api.items}/search`, query)
            setSourceItems(items || [])
        } catch {
            setSourceItems([])
        }
        setSourceLoading(false)
    }, [selectedNomenclatureId])

    useEffect(() => {
        loadSourceItems()
    }, [loadSourceItems])

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
                if (selectedNomenclatureId) {
                    setSourceItems((prev) => {
                        const existing = new Set(prev.map((i) => i.id))
                        const filtered = (items || []).filter(
                            (i) =>
                                i.nomenclatureId === selectedNomenclatureId &&
                                !existing.has(i.id),
                        )
                        return [...prev, ...filtered]
                    })
                }
            }
        } catch {
            /* ignore */
        }
    }, [tareBarcode, selectedNomenclatureId])

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

        if (!newTareTypeId || !newTareBarcode.trim()) return
        try {
            const created = await postData<TareInfo>(`${api.tares}`, {
                barcode: newTareBarcode.trim(),
                tareTypeId: newTareTypeId,
            })
            if (created) {
                setTargetTares((prev) => [...prev, { ...created, items: [] }])
                setNewTareBarcode('')
                setNewTareTypeId(undefined)
            }
        } catch (e: any) {
            alert(e.message || 'Failed to create tare')
        }
    }

    const searchAndAddTare = async () => {
        if (!newTareBarcode.trim()) return
        try {
            const tares = await getData<TareInfo[]>(
                `${api.tares}/search?barcode=${encodeURIComponent(newTareBarcode.trim())}`,
            )
            if (tares && tares.length > 0) {
                await addTargetTare(tares[0])
                setNewTareBarcode('')
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
                loadSourceItems()
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
        loadSourceItems()
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
                                <TextBox
                                    value={tareBarcode}
                                    onChange={(e) =>
                                        setTareBarcode(
                                            e.value?.toString() || '',
                                        )
                                    }
                                    placeholder="Scan or type barcode..."
                                    style={{ width: 200 }}
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
                        {sourceLoading && <span>Loading...</span>}
                        {!sourceLoading && sourceTares.length === 0 && (
                            <div className="no-items-message">
                                {selectedNomenclatureId
                                    ? 'No items found for this nomenclature'
                                    : 'Select a nomenclature to see source items'}
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
                                <TextBox
                                    value={newTareBarcode}
                                    onChange={(e) =>
                                        setNewTareBarcode(
                                            e.value?.toString() || '',
                                        )
                                    }
                                    placeholder="Tare barcode..."
                                    style={{ width: 180 }}
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
