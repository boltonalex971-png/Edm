import api from '@features/api/api'
import {
    HierarchyPicker,
    pruneHierarchy,
} from '@logistics/components/HierarchyPicker'
import { OutputItemsPanel } from '@logistics/components/orders/OutputItemsPanel'
import { TareBarcodePicker } from '@logistics/components/tare/TareBarcodePicker'
import {
    type SlotData,
    TareSchematic,
} from '@logistics/components/tare/TareSchematic'
import { GradeLegend } from '@logistics/components/transfer/GradeLegend'
import { NomenclatureLegend } from '@logistics/components/transfer/NomenclatureLegend'
import {
    type ContextTareOption,
    TransferContextMenu,
} from '@logistics/components/transfer/TransferContextMenu'
import {
    selectionSummary,
    visibleNomenclatures,
} from '@logistics/components/transfer/visibleFromItems'
import type {
    AllocateOutputsRequest,
    AllocateOutputsResult,
    AssignGradesRequest,
    AssignGradesResult,
    AvailableTare,
    Grade,
    Item,
    NomenclatureTareType,
    Order,
    OrderOutputItems,
    OutputAllocation,
    TareInfo,
    TreeDataItem,
    UUID,
} from '@logistics/data/types'
import {
    useEntityToken,
    useInvalidateEntities,
} from '@logistics/hooks/entityRefresh'
import { getData, postData, useGet } from '@logistics/hooks/hooks'
import { useTareTransfer } from '@logistics/hooks/useTareTransfer'
import { SmartScroll, SmartScrollContent } from '@microprojects/tools'
import { Button } from '@progress/kendo-react-buttons'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import '@logistics/components/repacking/Repacking.css'

type AllocateProcessOutputProps = {
    orderId: UUID
    onClose?: () => void
    onChanged?: () => void
}

export function AllocateProcessOutput({
    orderId,
    onClose,
    onChanged,
}: AllocateProcessOutputProps) {
    const [[tareTypes]] = useGet<TreeDataItem[]>(
        `${api.taretypes}/hierarchy`,
        [],
    )

    const invalidate = useInvalidateEntities()
    const orderToken = useEntityToken([{ type: 'order', id: orderId }])
    const [[output], loading] = useGet<OrderOutputItems>(
        `${api.orders}/${orderId}/output-items`,
        [orderId, orderToken],
    )
    const [[order]] = useGet<Order>(orderId ? `${api.orders}/${orderId}` : '', [
        orderId,
        orderToken,
    ])

    const orderNomenclatureId = order?.processNomenclatureId
    const [[allowedRows]] = useGet<NomenclatureTareType[]>(
        orderNomenclatureId
            ? `${api.nomenclatures}/${orderNomenclatureId}/taretypes`
            : '',
        [orderNomenclatureId],
    )
    const allowedTareTypeIds = useMemo(
        () =>
            orderNomenclatureId && allowedRows
                ? new Set<UUID>(allowedRows.map((r) => r.tareTypeId))
                : null,
        [orderNomenclatureId, allowedRows],
    )
    const tareTypeOptions = useMemo(
        () =>
            allowedTareTypeIds
                ? pruneHierarchy(tareTypes, allowedTareTypeIds)
                : (tareTypes ?? []),
        [tareTypes, allowedTareTypeIds],
    )

    const unallocated = output?.unallocated ?? []
    const processId = output?.processId

    const [[grades]] = useGet<Grade[]>(
        processId ? `${api.processes}/${processId}/grades` : '',
        [processId],
    )

    const transfer = useTareTransfer<Item>({ sourceItems: unallocated })
    const {
        selected: selectedItemIds,
        setSelected: setSelectedItemIds,
        handleSlotClick: onOutputSlotClick,
        toggleAll: onToggleAll,
        selectByPredicate,
        targetTares,
        addTargetTare: addTargetTareToWorkspace,
        removeTargetTare,
        updateTargetTares,
        expandedTareIds,
        toggleTareExpanded,
        expandTare,
        pending,
        addMove,
        distribute,
        reset: resetTransfer,
        clearPending,
        ctxMenu,
        openContextMenu,
        closeContextMenu,
        ctxEligibleIds,
    } = transfer

    // Single source of truth for the "add target tare" input — emitted by
    // TareBarcodePicker. When `.id` is set the user picked an existing
    // tare; when only `.barcode` is set, it's a typed-only custom value
    // that will become a new tare on commit.
    const [newTarePicked, setNewTarePicked] = useState<AvailableTare | null>(
        null,
    )
    const [newTareTypeId, setNewTareTypeId] = useState<UUID>()

    const [submitting, setSubmitting] = useState(false)
    const [submitResult, setSubmitResult] = useState<AllocateOutputsResult>()
    const [completing, setCompleting] = useState(false)
    const [error, setError] = useState<string>()

    // Wipe selection + pending only when the order itself changes.
    // `orderToken` rotates on every entity invalidation (e.g. assign-grade
    // refetch) — selection must survive those refreshes.
    useEffect(() => {
        setSelectedItemIds(new Set())
        clearPending()
    }, [orderId, setSelectedItemIds, clearPending])

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
    // switch to a different order's nomenclature re-seeds.
    const seededForRef = useRef<UUID | null>(null)
    useEffect(() => {
        if (!orderNomenclatureId || !allowedRows) return
        if (seededForRef.current === orderNomenclatureId) return
        seededForRef.current = orderNomenclatureId
        const def = allowedRows.find((r) => r.isDefault)
        if (def) setNewTareTypeId(def.tareTypeId)
    }, [orderNomenclatureId, allowedRows])

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
            updateTargetTares((prev) => {
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

    const newTareBarcodeText = newTarePicked?.barcode?.trim() ?? ''

    const addTargetTare = async (existing?: TareInfo) => {
        if (existing) {
            if (targetTares.some((t) => t.id === existing.id)) {
                expandTare(existing.id)
                return
            }
            const items = await getData<Item[]>(
                `${api.items}/tare/${existing.id}`,
            )
            addTargetTareToWorkspace(existing, items || [])
            return
        }

        if (!newTareTypeId || !newTareBarcodeText) return
        try {
            const created = await postData<TareInfo>(`${api.tares}`, {
                barcode: newTareBarcodeText,
                tareTypeId: newTareTypeId,
            })
            if (created) {
                addTargetTareToWorkspace(created, [])
                setNewTarePicked(null)
            }
        } catch (e: any) {
            setError(e.message || 'Failed to create tare')
        }
    }

    const searchAndAddTare = async () => {
        setError(undefined)
        // Picker already resolved an existing tare for us — short-circuit.
        if (newTarePicked?.id) {
            await addTargetTare(newTarePicked)
            setNewTarePicked(null)
            return
        }
        if (!newTareBarcodeText) return
        try {
            const tares = await getData<TareInfo[]>(
                `${api.tares}/search?barcode=${encodeURIComponent(newTareBarcodeText)}`,
            )
            if (tares && tares.length > 0) {
                await addTargetTare(tares[0])
                setNewTarePicked(null)
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

    const selectedItems: Item[] = useMemo(
        () => unallocated.filter((i) => selectedItemIds.has(i.id)),
        [unallocated, selectedItemIds],
    )

    const selectionLabel = useMemo(() => {
        if (selectedItems.length === 0) return null
        const { nomenclatureNames, gradeNames } = selectionSummary(
            selectedItems,
        )
        const segments = [`${selectedItems.length} selected`]
        if (nomenclatureNames.length > 0)
            segments.push(nomenclatureNames.join(', '))
        if (gradeNames.length > 0) segments.push(gradeNames.join(', '))
        return segments.join(' · ')
    }, [selectedItems])

    const pendingItemIds = useMemo(
        () => new Set(pending.map((p) => p.itemId)),
        [pending],
    )

    const handleTargetSlotClick = (tareId: UUID, slot: SlotData) => {
        if (slot.item || selectedItems.length === 0) return
        addMove(selectedItems[0], tareId, slot.address)
    }

    const submit = async () => {
        if (pending.length === 0) return
        setSubmitting(true)
        setError(undefined)
        try {
            const allocations: OutputAllocation[] = pending.map((m) => ({
                itemId: m.itemId,
                tareId: m.targetTareId,
                address: m.address,
            }))
            const request: AllocateOutputsRequest = { allocations }
            const result = await postData<AllocateOutputsResult>(
                `${api.orders}/${orderId}/allocate-outputs`,
                request,
            )
            setSubmitResult(result)
            if (result.errors.length === 0) {
                clearPending()
                invalidate([
                    { type: 'order', id: orderId },
                    { type: 'item' },
                    { type: 'tare' },
                ])
                onChanged?.()
            }
        } catch (e: any) {
            setError(e.message || 'Allocation request failed')
        }
        setSubmitting(false)
    }

    const reset = () => {
        setSubmitResult(undefined)
        resetTransfer()
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
            invalidate([
                { type: 'order', id: orderId },
                { type: 'item' },
            ])
            onChanged?.()
        } catch (e: any) {
            setError(e.message || 'Grade assignment failed')
        }
    }

    const completeOrder = async () => {
        setError(undefined)
        setCompleting(true)
        try {
            await postData(`${api.orders}/${orderId}/complete`, {})
            onChanged?.()
            onClose?.()
        } catch (e: any) {
            setError(e?.message || 'Failed to complete the order')
        }
        setCompleting(false)
    }

    const canComplete =
        unallocated.length === 0 && pending.length === 0 && !loading

    const onCtxAutofill = () => {
        distribute(ctxEligibleIds)
        closeContextMenu()
    }

    const onCtxFillTare = (tareId: UUID) => {
        distribute(ctxEligibleIds, tareId)
        closeContextMenu()
    }

    const onCtxAssignGrade = async (gradeId: UUID | undefined) => {
        closeContextMenu()
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

    const selectByGrade = (gradeId: UUID | null) =>
        selectByPredicate((i) => (i.gradeId ?? null) === gradeId)
    const selectByNomenclature = (nomenclatureId: UUID) =>
        selectByPredicate((i) => i.nomenclatureId === nomenclatureId)

    const targetToolbar = (
        <div className="column-toolbar">
            <div className="field-group">
                <label>Add target tare</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <TareBarcodePicker
                        tareTypeId={newTareTypeId}
                        nomenclatureId={orderNomenclatureId}
                        value={newTarePicked}
                        onChange={(tare) => setNewTarePicked(tare)}
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
                    <Button themeColor="primary" onClick={searchAndAddTare}>
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
                    {submitting ? 'Saving...' : `Apply (${pending.length})`}
                </Button>
                <Button onClick={reset} disabled={pending.length === 0}>
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
    )

    return (
        <div className="repacking-page">
            {error && (
                <div style={{ color: '#d32f2f', marginBottom: '0.5rem' }}>
                    {error}
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 20,
                    marginBottom: 0,
                    background: '#fff',
                    alignItems: 'center',
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        flex: 1,
                        fontSize: '1rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.4rem',
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
                <div style={{ flex: 1 }}>{targetToolbar}</div>
            </div>

            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                }}
            >
                <SmartScroll
                    offsetTop={0}
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
                                {grades && grades.length > 0 && (
                                    <GradeLegend
                                        grades={grades}
                                        onPick={selectByGrade}
                                    />
                                )}
                                <NomenclatureLegend
                                    nomenclatures={visibleNomenclatures(
                                        unallocated,
                                    )}
                                    onPick={selectByNomenclature}
                                />
                                {selectionLabel && (
                                    <span
                                        title="Click an empty target slot to place, or right-click for more."
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
                        </div>
                    </SmartScrollContent>

                    <SmartScrollContent style={{ flex: 1 }}>
                        <div className="repacking-panel target">
                            <h3>Target tares</h3>
                            {targetTares.length === 0 && (
                                <div className="no-items-message">
                                    Add target tares by barcode search or create
                                    new ones
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
                                                {isExpanded
                                                    ? '\u25be'
                                                    : '\u25b8'}
                                            </span>
                                            <strong
                                                style={{ fontSize: '0.9rem' }}
                                            >
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
                                                    mutedItem={(item) =>
                                                        pendingItemIds.has(
                                                            item.id,
                                                        )
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
            </div>

            {ctxMenu && (
                <TransferContextMenu
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
                    onClose={closeContextMenu}
                />
            )}
        </div>
    )
}
