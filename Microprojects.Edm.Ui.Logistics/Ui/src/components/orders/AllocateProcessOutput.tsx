import api from '@features/api/api'
import { PageTitle } from '@logistics/components/PageTitle'
import {
    type SlotData,
    TareSchematic,
} from '@logistics/components/tare/TareSchematic'
import type {
    AllocateOutputsRequest,
    AllocateOutputsResult,
    Item,
    OrderOutputItems,
    OutputAllocation,
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
import { TextBox } from '@progress/kendo-react-inputs'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '@logistics/components/repacking/Repacking.css'

type TargetTareState = TareInfo & {
    items: Item[]
}

export function AllocateProcessOutput() {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [[tareTypes]] = useGet<TareType[]>(api.taretypes, [])

    const [reloadToken, setReloadToken] = useState(0)
    const [[output], loading] = useGet<OrderOutputItems>(
        `${api.orders}/${orderId}/output-items`,
        [orderId, reloadToken],
    )

    const [selectedItemIds, setSelectedItemIds] = useState<Set<UUID>>(new Set())
    const [targetTares, setTargetTares] = useState<TargetTareState[]>([])

    const [newTareBarcode, setNewTareBarcode] = useState('')
    const [newTareTypeId, setNewTareTypeId] = useState<UUID>()
    const [tareTypeFilter, setTareTypeFilter] = useState('')

    const [pending, setPending] = useState<OutputAllocation[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [submitResult, setSubmitResult] = useState<AllocateOutputsResult>()
    const [completing, setCompleting] = useState(false)
    const [error, setError] = useState<string>()

    useEffect(() => {
        setSelectedItemIds(new Set())
        setPending([])
    }, [reloadToken, orderId])

    const unallocated = output?.unallocated ?? []

    const filteredTareTypes = useMemo(() => {
        if (!tareTypes) return []
        if (!tareTypeFilter) return tareTypes
        const lc = tareTypeFilter.toLowerCase()
        return tareTypes.filter((t) => t.name.toLowerCase().includes(lc))
    }, [tareTypes, tareTypeFilter])

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
            setError(e.message || 'Failed to create tare')
        }
    }

    const searchAndAddTare = async () => {
        setError(undefined)
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
                setError(
                    'Tare not found. Select a tare type to create a new one.',
                )
            }
        } catch {
            setError('Failed to search tare')
        }
    }

    const removeTargetTare = (tareId: UUID) => {
        const tare = targetTares.find((t) => t.id === tareId)
        if (!tare) return
        const movedBackIds = new Set(
            pending.filter((m) => m.tareId === tareId).map((m) => m.itemId),
        )
        setPending((prev) => prev.filter((m) => m.tareId !== tareId))
        setTargetTares((prev) => prev.filter((t) => t.id !== tareId))
        setSelectedItemIds((prev) => {
            const next = new Set(prev)
            movedBackIds.forEach((id) => next.delete(id))
            return next
        })
    }

    const toggleItemSelected = (id: UUID) => {
        setSelectedItemIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const selectedItems: Item[] = useMemo(
        () => unallocated.filter((i) => selectedItemIds.has(i.id)),
        [unallocated, selectedItemIds],
    )

    const handleTargetSlotClick = (tareId: UUID, slot: SlotData) => {
        if (slot.item || selectedItems.length === 0) return
        const item = selectedItems[0]
        addMove(item, tareId, slot.address)
    }

    const addMove = (item: Item, tareId: UUID, address?: number) => {
        setPending((prev) => {
            const filtered = prev.filter((m) => m.itemId !== item.id)
            return [...filtered, { itemId: item.id, tareId, address }]
        })
        setTargetTares((prev) =>
            prev.map((t) =>
                t.id === tareId
                    ? { ...t, items: [...t.items, { ...item, address }] }
                    : t,
            ),
        )
        setSelectedItemIds((prev) => {
            const next = new Set(prev)
            next.delete(item.id)
            return next
        })
    }

    const autoFill = () => {
        if (targetTares.length === 0 || selectedItems.length === 0) return
        const remaining = [...selectedItems]
        const newPending: OutputAllocation[] = [...pending]
        const updated = targetTares.map((t) => {
            const capacity = Math.floor(t.capacity)
            const occupied = new Set(t.items.map((i) => i.address))
            const items = [...t.items]
            for (
                let addr = 1;
                addr <= capacity && remaining.length > 0;
                addr++
            ) {
                if (occupied.has(addr)) continue
                const item = remaining.shift()!
                items.push({ ...item, address: addr })
                newPending.push({
                    itemId: item.id,
                    tareId: t.id,
                    address: addr,
                })
            }
            return { ...t, items }
        })
        setPending(newPending)
        setTargetTares(updated)
        const movedIds = new Set(
            selectedItems
                .filter((si) => !remaining.includes(si))
                .map((i) => i.id),
        )
        setSelectedItemIds((prev) => {
            const next = new Set(prev)
            movedIds.forEach((id) => next.delete(id))
            return next
        })
    }

    const submit = async () => {
        if (pending.length === 0) return
        setSubmitting(true)
        setError(undefined)
        try {
            const request: AllocateOutputsRequest = { allocations: pending }
            const result = await postData<AllocateOutputsResult>(
                `${api.orders}/${orderId}/allocate-outputs`,
                request,
            )
            setSubmitResult(result)
            if (result.errors.length === 0) {
                setPending([])
                setReloadToken((x) => x + 1)
            }
        } catch (e: any) {
            setError(e.message || 'Allocation request failed')
        }
        setSubmitting(false)
    }

    const reset = () => {
        setPending([])
        setSelectedItemIds(new Set())
        setSubmitResult(undefined)
        setTargetTares((prev) =>
            prev.map((t) => ({
                ...t,
                items: t.items.filter(
                    (i) =>
                        !pending.some(
                            (p) => p.itemId === i.id && p.tareId === t.id,
                        ),
                ),
            })),
        )
    }

    const completeOrder = async () => {
        setError(undefined)
        setCompleting(true)
        try {
            await postData(`${api.orders}/${orderId}/complete`, {})
            navigate('/orders/ongoing')
        } catch (e: any) {
            setError(e?.message || 'Failed to complete the order')
        }
        setCompleting(false)
    }

    const canComplete =
        unallocated.length === 0 && pending.length === 0 && !loading

    return (
        <div className="repacking-page">
            <PageTitle title="Allocate process output" />
            <hr />

            {error && (
                <div style={{ color: '#d32f2f', marginBottom: '0.5rem' }}>
                    {error}
                </div>
            )}

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
                    <div className="repacking-panel source">
                        <h3>Unallocated outputs</h3>
                        {loading && <span>Loading...</span>}
                        {!loading && unallocated.length === 0 && (
                            <div className="no-items-message">
                                No unallocated outputs
                            </div>
                        )}
                        {unallocated.length > 0 && (
                            <table
                                className="k-table k-table-md"
                                style={{ width: '100%' }}
                            >
                                <thead>
                                    <tr>
                                        <th style={{ width: 40 }} />
                                        <th style={{ textAlign: 'left' }}>
                                            Nomenclature
                                        </th>
                                        <th
                                            style={{
                                                textAlign: 'right',
                                                width: 100,
                                            }}
                                        >
                                            Quantity
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unallocated.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItemIds.has(
                                                        item.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleItemSelected(
                                                            item.id,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>{item.nomenclatureName}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                {item.quantity}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {selectedItems.length > 0 && (
                            <div
                                style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.85rem',
                                    color: '#1976d2',
                                }}
                            >
                                {selectedItems.length} selected &mdash; click an
                                empty target slot to place, or use Auto-fill.
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
                                    selectedItems.length === 0 ||
                                    targetTares.length === 0
                                }
                            >
                                Auto-fill
                            </Button>
                            <Button
                                themeColor="success"
                                onClick={submit}
                                disabled={pending.length === 0 || submitting}
                            >
                                {submitting
                                    ? 'Saving...'
                                    : `Apply (${pending.length})`}
                            </Button>
                            <Button
                                onClick={reset}
                                disabled={pending.length === 0}
                            >
                                Reset
                            </Button>
                            {submitResult && submitResult.errors.length > 0 && (
                                <span
                                    style={{
                                        color: '#d32f2f',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    {submitResult.errors[0]}
                                </span>
                            )}
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
                                    onSlotClick={(slot) =>
                                        handleTargetSlotClick(t.id, slot)
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

            <hr />
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Button
                    onClick={() => navigate(-1)}
                    disabled={submitting || completing}
                >
                    Back
                </Button>
                <Button
                    themeColor="primary"
                    size="large"
                    onClick={completeOrder}
                    disabled={!canComplete || completing}
                >
                    {completing ? 'Completing...' : 'Complete order'}
                </Button>
            </div>
        </div>
    )
}
