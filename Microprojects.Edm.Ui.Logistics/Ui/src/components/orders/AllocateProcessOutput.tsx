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
import {
    ExpandLessOutlined as ExpandIcon,
    ExpandMoreOutlined as CollapseIcon,
} from '@mui/icons-material'
import {
    Alert,
    Box,
    Button as MuiButton,
    CircularProgress,
    Paper,
    Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'

type AllocateProcessOutputProps = {
    orderId: UUID
    onClose?: () => void
    onChanged?: () => void
}

const monoLabelSx = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    color: 'var(--ink-3)',
    mb: 0.5,
}

const panelHeadingSx = {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--ink-1)',
    m: 0,
    mb: 0.75,
}

export function AllocateProcessOutput({
    orderId,
    onClose: _onClose,
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
        <Box>
            <Typography sx={monoLabelSx}>Add target tare</Typography>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'nowrap',
                }}
            >
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
                    width={180}
                    placeholder="Type (for new)…"
                />
                <MuiButton variant="contained" onClick={searchAndAddTare}>
                    Add tare
                </MuiButton>
                <Box
                    sx={{
                        width: '1px',
                        alignSelf: 'stretch',
                        background: 'var(--line)',
                        mx: 0.5,
                    }}
                />
                {submitResult && submitResult.errors.length > 0 && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'var(--sig-fault-deep)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {submitResult.errors[0]}
                    </Typography>
                )}
                <MuiButton
                    variant="contained"
                    color="success"
                    onClick={submit}
                    disabled={pending.length === 0 || submitting}
                >
                    {submitting ? 'Saving…' : `Apply (${pending.length})`}
                </MuiButton>
                <MuiButton
                    variant="outlined"
                    onClick={reset}
                    disabled={pending.length === 0}
                >
                    Reset
                </MuiButton>
            </Box>
        </Box>
    )

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
            }}
        >
            {error && (
                <Alert severity="error" sx={{ mb: 0.5 }}>
                    {error}
                </Alert>
            )}

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 2.5,
                    alignItems: 'center',
                    px: 1,
                    py: 0.75,
                    borderRadius: 'var(--r-2)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    flexShrink: 0,
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 0.75,
                    }}
                >
                    {order && (
                        <>
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: 'var(--ink-1)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {order.processName}
                            </Typography>
                            {order.processNomenclatureName && (
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'var(--ink-3)' }}
                                >
                                    · {order.processNomenclatureName}
                                </Typography>
                            )}
                            {order.completed && (
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'var(--sig-run-deep)' }}
                                >
                                    · Completed
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
                <Box sx={{ flex: '0 0 auto' }}>{targetToolbar}</Box>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
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
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.25,
                                border: '1px solid var(--line)',
                                borderRadius: 'var(--r-2)',
                                background: 'var(--surface)',
                            }}
                        >
                            <Typography component="h3" sx={panelHeadingSx}>
                                Unallocated outputs
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    columnGap: 2,
                                    rowGap: 0.5,
                                    mt: 0.5,
                                    mb: 1,
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
                                    <Typography
                                        variant="caption"
                                        title="Click an empty target slot to place, or right-click for more."
                                        sx={{
                                            color: 'var(--accent)',
                                            fontWeight: 600,
                                            ml: 'auto',
                                        }}
                                    >
                                        {selectionLabel}
                                    </Typography>
                                )}
                            </Box>
                            {loading && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: 'var(--ink-3)',
                                    }}
                                >
                                    <CircularProgress size={14} />
                                    <Typography variant="caption">
                                        Loading…
                                    </Typography>
                                </Box>
                            )}
                            {!loading && unallocated.length === 0 && (
                                <EmptyMsg text="No unallocated outputs" />
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
                        </Paper>
                    </SmartScrollContent>

                    <SmartScrollContent style={{ flex: 1 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.25,
                                border: '1px solid var(--line)',
                                borderRadius: 'var(--r-2)',
                                background: 'var(--surface)',
                            }}
                        >
                            <Typography component="h3" sx={panelHeadingSx}>
                                Target tares
                            </Typography>
                            {targetTares.length === 0 && (
                                <EmptyMsg text="Add target tares by barcode search or create new ones" />
                            )}
                            {targetTares.map((t) => {
                                const isExpanded = expandedTareIds.has(t.id)
                                const cap = Math.floor(t.capacity)
                                const hasCommittedFromOrder = t.items.some(
                                    (i) =>
                                        i.orderId === orderId &&
                                        !pendingItemIds.has(i.id),
                                )
                                const Icon = isExpanded ? ExpandIcon : CollapseIcon
                                return (
                                    <Box
                                        key={t.id}
                                        sx={{
                                            border: '1px solid var(--line)',
                                            borderRadius: 'var(--r-2)',
                                            mb: 1,
                                            background: 'var(--surface-2)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            onClick={() =>
                                                toggleTareExpanded(t.id)
                                            }
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                px: 1,
                                                py: 0.75,
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                '&:hover': {
                                                    background: 'var(--surface-3)',
                                                },
                                            }}
                                        >
                                            <Icon
                                                fontSize="small"
                                                sx={{ color: 'var(--ink-3)' }}
                                            />
                                            <Typography
                                                sx={{
                                                    fontFamily:
                                                        'var(--font-mono)',
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    color: 'var(--ink-1)',
                                                }}
                                            >
                                                {t.barcode || 'Tare'}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: 'var(--ink-3)' }}
                                            >
                                                {t.tareTypeName} ·{' '}
                                                {t.items.length}/{cap}
                                            </Typography>
                                            <Box sx={{ flex: 1 }} />
                                            {!hasCommittedFromOrder && (
                                                <MuiButton
                                                    size="small"
                                                    variant="text"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        removeTargetTare(t.id)
                                                    }}
                                                >
                                                    Remove
                                                </MuiButton>
                                            )}
                                        </Box>
                                        {isExpanded && (
                                            <Box
                                                sx={{
                                                    px: 1,
                                                    pb: 1,
                                                    background: 'var(--surface)',
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
                                            </Box>
                                        )}
                                    </Box>
                                )
                            })}
                        </Paper>
                    </SmartScrollContent>
                </SmartScroll>
            </Box>

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
        </Box>
    )
}

function EmptyMsg({ text }: { text: string }) {
    return (
        <Box
            sx={{
                py: 1.5,
                textAlign: 'center',
                color: 'var(--ink-3)',
                fontStyle: 'italic',
                fontSize: 13,
            }}
        >
            {text}
        </Box>
    )
}
