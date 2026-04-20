import api from '@features/api/api'
import { PageTitle } from '@logistics/components/PageTitle'
import {
    AllocateContextMenu,
    type ContextTareOption,
} from '@logistics/components/orders/AllocateContextMenu'
import { GradeLegend } from '@logistics/components/orders/GradeLegend'
import { OutputItemsPanel } from '@logistics/components/orders/OutputItemsPanel'
import {
    type SlotData,
    TareSchematic,
} from '@logistics/components/tare/TareSchematic'
import type {
    AllocateOutputsRequest,
    AllocateOutputsResult,
    AssignGradesRequest,
    AssignGradesResult,
    Grade,
    Item,
    Order,
    OrderOutputItems,
    OutputAllocation,
    TareInfo,
    TareType,
    UUID,
} from '@logistics/data/types'
import { getData, postData, useGet } from '@logistics/hooks/hooks'
import { useSlotSelection } from '@logistics/hooks/useSlotSelection'
import { SmartScroll, SmartScrollContent } from '@microprojects/tools'
import { Button } from '@progress/kendo-react-buttons'
import {
    ComboBox,
    type ComboBoxFilterChangeEvent,
} from '@progress/kendo-react-dropdowns'
import { TextBox } from '@progress/kendo-react-inputs'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '@logistics/components/repacking/Repacking.css'

type TargetTareState = TareInfo & {
    items: Item[]
}

type ContextMenuState = {
    x: number
    y: number
    itemId: UUID
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
    const [[order]] = useGet<Order>(
        orderId ? `${api.orders}/${orderId}` : '',
        [orderId, reloadToken],
    )

    const unallocated = output?.unallocated ?? []
    const processId = output?.processId

    const [[grades]] = useGet<Grade[]>(
        processId ? `${api.processes}/${processId}/grades` : '',
        [processId],
    )

    const {
        selected: selectedItemIds,
        setSelected: setSelectedItemIds,
        handleClick: onOutputSlotClick,
        toggleAll: onToggleAll,
    } = useSlotSelection(unallocated)

    const [targetTares, setTargetTares] = useState<TargetTareState[]>([])

    const [newTareBarcode, setNewTareBarcode] = useState('')
    const [newTareTypeId, setNewTareTypeId] = useState<UUID>()
    const [tareTypeFilter, setTareTypeFilter] = useState('')

    const [pending, setPending] = useState<OutputAllocation[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [submitResult, setSubmitResult] = useState<AllocateOutputsResult>()
    const [completing, setCompleting] = useState(false)
    const [error, setError] = useState<string>()
    const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null)
    const [expandedTareIds, setExpandedTareIds] = useState<Set<UUID>>(new Set())

    const expandTare = (tareId: UUID) =>
        setExpandedTareIds((prev) => {
            if (prev.has(tareId)) return prev
            const next = new Set(prev)
            next.add(tareId)
            return next
        })

    const toggleTareExpanded = (tareId: UUID) =>
        setExpandedTareIds((prev) => {
            const next = new Set(prev)
            if (next.has(tareId)) next.delete(tareId)
            else next.add(tareId)
            return next
        })

    useEffect(() => {
        setSelectedItemIds(new Set())
        setPending([])
    }, [reloadToken, orderId, setSelectedItemIds])

    // Pre-populate the target-tares list with every tare that already holds at
    // least one output item from this order. On each refresh, re-fetch each
    // tare's contents so the display reflects the server's truth (including
    // items from other orders that happen to share the tare). Tares added
    // manually but still empty are preserved.
    useEffect(() => {
        if (!output?.allocated || output.allocated.length === 0) return

        const seeds = new Map<UUID, Item>()
        for (const item of output.allocated) {
            if (item.tareId && item.tareTareTypeId && !seeds.has(item.tareId)) {
                seeds.set(item.tareId, item)
            }
        }
        if (seeds.size === 0) return

        let cancelled = false
        ;(async () => {
            const fetched = new Map<UUID, Item[]>()
            for (const id of seeds.keys()) {
                try {
                    const items = await getData<Item[]>(
                        `${api.items}/tare/${id}`,
                    )
                    fetched.set(id, items ?? [])
                } catch {
                    fetched.set(id, [])
                }
            }
            if (cancelled) return
            setTargetTares((prev) => {
                const next = [...prev]
                for (const [id, sample] of seeds) {
                    const items = fetched.get(id) ?? []
                    const info: TareInfo = {
                        id,
                        barcode: sample.tareBarcode,
                        tareTypeId: sample.tareTareTypeId as UUID,
                        tareTypeName: sample.tareTareTypeName,
                        tareTypeUnits: sample.tareTareTypeUnits,
                        sizeX: sample.tareTareTypeSizeX,
                        sizeY: sample.tareTareTypeSizeY,
                        sizeZ: sample.tareTareTypeSizeZ,
                        dimensions: sample.tareTareTypeDimensions,
                        capacity: sample.tareTareTypeCapacity,
                    }
                    const idx = next.findIndex((t) => t.id === id)
                    if (idx >= 0) {
                        next[idx] = { ...next[idx], ...info, items }
                    } else {
                        next.push({ ...info, items })
                    }
                }
                return next
            })
        })()

        return () => {
            cancelled = true
        }
    }, [output])

    const filteredTareTypes = useMemo(() => {
        if (!tareTypes) return []
        if (!tareTypeFilter) return tareTypes
        const lc = tareTypeFilter.toLowerCase()
        return tareTypes.filter((t) => t.name.toLowerCase().includes(lc))
    }, [tareTypes, tareTypeFilter])

    const addTargetTare = async (existing?: TareInfo) => {
        if (existing) {
            if (targetTares.some((t) => t.id === existing.id)) {
                expandTare(existing.id)
                return
            }
            const items = await getData<Item[]>(
                `${api.items}/tare/${existing.id}`,
            )
            setTargetTares((prev) => [
                ...prev,
                { ...existing, items: items || [] },
            ])
            expandTare(existing.id)
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
                expandTare(created.id)
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
        setExpandedTareIds((prev) => {
            if (!prev.has(tareId)) return prev
            const next = new Set(prev)
            next.delete(tareId)
            return next
        })
        setSelectedItemIds((prev) => {
            const next = new Set(prev)
            movedBackIds.forEach((id) => next.delete(id))
            return next
        })
    }

    const selectedItems: Item[] = useMemo(
        () => unallocated.filter((i) => selectedItemIds.has(i.id)),
        [unallocated, selectedItemIds],
    )

    const pendingItemIds = useMemo(
        () => new Set(pending.map((p) => p.itemId)),
        [pending],
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

    const distribute = (itemIds: UUID[], onlyTareId?: UUID) => {
        const itemsToFill = unallocated.filter(
            (i) => itemIds.includes(i.id) && !pendingItemIds.has(i.id),
        )
        if (itemsToFill.length === 0) return
        const tareIdsInScope = onlyTareId
            ? new Set([onlyTareId])
            : new Set(targetTares.map((t) => t.id))
        if (tareIdsInScope.size === 0) return

        const remaining = [...itemsToFill]
        const newPending: OutputAllocation[] = [...pending]
        const filledTareIds = new Set<UUID>()
        const updated = targetTares.map((t) => {
            if (!tareIdsInScope.has(t.id)) return t
            const capacity = Math.floor(t.capacity)
            const occupied = new Set(t.items.map((i) => i.address))
            const items = [...t.items]
            const sizeBefore = items.length
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
            if (items.length > sizeBefore) filledTareIds.add(t.id)
            return { ...t, items }
        })
        setPending(newPending)
        setTargetTares(updated)
        const movedIds = new Set(
            itemsToFill.filter((si) => !remaining.includes(si)).map((i) => i.id),
        )
        setSelectedItemIds((prev) => {
            const next = new Set(prev)
            movedIds.forEach((id) => next.delete(id))
            return next
        })
        if (filledTareIds.size > 0) {
            setExpandedTareIds((prev) => {
                const next = new Set(prev)
                filledTareIds.forEach((id) => next.add(id))
                return next
            })
        }
    }

    const autoFillItems = (itemIds: UUID[]) => distribute(itemIds)
    const fillTareWithItems = (itemIds: UUID[], tareId: UUID) =>
        distribute(itemIds, tareId)

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

    const callAssignGrades = async (
        gradeId: UUID | undefined,
        itemIds: UUID[],
    ) => {
        if (itemIds.length === 0) return
        setError(undefined)
        try {
            const request: AssignGradesRequest = { gradeId, itemIds }
            const result = await postData<AssignGradesResult>(
                `${api.orders}/${orderId}/assign-grades`,
                request,
            )
            if (result.errors && result.errors.length > 0) {
                setError(result.errors[0])
            }
            setReloadToken((x) => x + 1)
        } catch (e: any) {
            setError(e.message || 'Grade assignment failed')
        }
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

    const openContextMenu = (item: Item, e: React.MouseEvent) => {
        e.preventDefault()
        setCtxMenu({ x: e.clientX, y: e.clientY, itemId: item.id })
    }

    const ctxTargetIds = useMemo<UUID[]>(() => {
        if (!ctxMenu) return []
        return selectedItemIds.has(ctxMenu.itemId)
            ? [...selectedItemIds]
            : [ctxMenu.itemId]
    }, [ctxMenu, selectedItemIds])

    const ctxEligibleIds = useMemo(
        () => ctxTargetIds.filter((id) => !pendingItemIds.has(id)),
        [ctxTargetIds, pendingItemIds],
    )

    const onCtxAutofill = () => {
        autoFillItems(ctxEligibleIds)
        setCtxMenu(null)
    }

    const onCtxFillTare = (tareId: UUID) => {
        fillTareWithItems(ctxEligibleIds, tareId)
        setCtxMenu(null)
    }

    const onCtxAssignGrade = async (gradeId: UUID | undefined) => {
        setCtxMenu(null)
        await callAssignGrades(gradeId, ctxEligibleIds)
    }

    const ctxTareOptions = useMemo<ContextTareOption[]>(
        () =>
            targetTares.map((t) => ({
                ...t,
                occupied: t.items.length,
                capacity: Math.floor(t.capacity),
            })),
        [targetTares],
    )

    const selectByGrade = (gradeId: UUID | null) => {
        const ids = new Set(
            unallocated
                .filter((i) => (i.gradeId ?? null) === gradeId)
                .map((i) => i.id),
        )
        setSelectedItemIds(ids)
    }

    return (
        <div className="repacking-page">
            <PageTitle title="Allocate process output" />
            <hr />

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '0.75rem',
                }}
            >
                <Button
                    onClick={() => navigate(-1)}
                    disabled={submitting || completing}
                >
                    Back
                </Button>
                <div
                    style={{
                        flex: 1,
                        fontSize: '1rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.5rem',
                    }}
                >
                    {order && (
                        <>
                            <span>{order.processName}</span>
                            {order.processNomenclatureName && (
                                <small style={{ color: '#777' }}>
                                    &middot; {order.processNomenclatureName}
                                </small>
                            )}
                            {order.completed && (
                                <small style={{ color: '#2e7d32' }}>
                                    &middot; Completed
                                </small>
                            )}
                        </>
                    )}
                </div>
                {order && !order.completed && (
                    <Button
                        themeColor="primary"
                        onClick={completeOrder}
                        disabled={!canComplete || completing}
                    >
                        {completing ? 'Completing...' : 'Complete order'}
                    </Button>
                )}
            </div>

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
                        {grades && grades.length > 0 && (
                            <GradeLegend
                                grades={grades}
                                onPick={selectByGrade}
                            />
                        )}
                        {loading && <span>Loading...</span>}
                        {!loading && unallocated.length === 0 && (
                            <div className="no-items-message">
                                No unallocated outputs
                            </div>
                        )}
                        {unallocated.length > 0 && (
                            <OutputItemsPanel
                                items={unallocated}
                                selectedIds={selectedItemIds}
                                onSlotClick={onOutputSlotClick}
                                onToggleAll={onToggleAll}
                                onItemContextMenu={openContextMenu}
                            />
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
                                empty target slot to place, or right-click for
                                more.
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
                        {targetTares.map((t) => {
                            const isExpanded = expandedTareIds.has(t.id)
                            const cap = Math.floor(t.capacity)
                            const hasCommittedFromOrder = t.items.some(
                                (i) =>
                                    i.orderId === orderId &&
                                    !pendingItemIds.has(i.id),
                            )
                            return (
                                <div
                                    key={t.id}
                                    style={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 6,
                                        marginBottom: 8,
                                        background: '#fafafa',
                                    }}
                                >
                                    <div
                                        onClick={() =>
                                            toggleTareExpanded(t.id)
                                        }
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.4rem 0.6rem',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 14,
                                                color: '#666',
                                            }}
                                        >
                                            {isExpanded ? '\u25be' : '\u25b8'}
                                        </span>
                                        <strong style={{ fontSize: '0.9rem' }}>
                                            {t.barcode || 'Tare'}
                                        </strong>
                                        <small style={{ color: '#777' }}>
                                            {t.tareTypeName}
                                            {' \u00b7 '}
                                            {t.items.length}/{cap}
                                        </small>
                                        <span style={{ flex: 1 }} />
                                        {!hasCommittedFromOrder && (
                                            <Button
                                                size="small"
                                                fillMode="flat"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeTargetTare(t.id)
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    {isExpanded && (
                                        <div
                                            style={{
                                                padding: '0 0.6rem 0.6rem',
                                            }}
                                        >
                                            <TareSchematic
                                                tare={t}
                                                items={t.items}
                                                highlightEmpty
                                                onSlotClick={(slot) =>
                                                    handleTargetSlotClick(
                                                        t.id,
                                                        slot,
                                                    )
                                                }
                                                dimItem={(item) =>
                                                    item.orderId !== orderId
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </SmartScrollContent>
            </SmartScroll>

            {ctxMenu && (
                <AllocateContextMenu
                    x={ctxMenu.x}
                    y={ctxMenu.y}
                    grades={grades ?? []}
                    tares={ctxTareOptions}
                    targetCount={ctxEligibleIds.length}
                    canAutofill={
                        targetTares.length > 0 && ctxEligibleIds.length > 0
                    }
                    onAutofillAll={onCtxAutofill}
                    onFillTare={onCtxFillTare}
                    onAssignGrade={onCtxAssignGrade}
                    onClose={() => setCtxMenu(null)}
                />
            )}
        </div>
    )
}
