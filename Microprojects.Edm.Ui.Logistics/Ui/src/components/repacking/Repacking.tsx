import api from '@features/api/api'
import {
    HierarchyPicker,
    findInHierarchy,
    pruneHierarchy,
} from '@logistics/components/HierarchyPicker'
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
import { SubRootPage } from '@microprojects/edm-components/components/chrome/SubRootPage'
import { SmartScroll, SmartScrollContent } from '@microprojects/tools'
import {
    Alert,
    Box,
    Button as MuiButton,
    Paper,
    Typography,
} from '@mui/material'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
    pb: 0.5,
}

const panelPaperSx = {
    p: 1.25,
    border: '1px solid var(--line)',
    borderRadius: 'var(--r-2)',
    background: 'var(--surface)',
}

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
    const {
        selected: selectedSourceItemIds,
        handleSlotClick: onSourceItemClick,
        clear: _clearSourceSelection,
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
    })

    const [tarePicked, setTarePicked] = useState<AvailableTare | null>(null)
    const [newTarePicked, setNewTarePicked] = useState<AvailableTare | null>(
        null,
    )
    const [newTareTypeId, setNewTareTypeId] = useState<UUID>()

    const tareBarcode = tarePicked?.barcode ?? ''
    const newTareBarcode = newTarePicked?.barcode ?? ''

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

    const [expandedSource, setExpandedSource] = useState<Set<string>>(new Set())

    const toggleExpandedSource = (key: string) =>
        setExpandedSource((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })

    const removeSourceTare = (tareKey: string) => {
        setSourceItems((prev) =>
            prev.filter((i) => {
                const itemTareKey = i.tareId || i.tareBarcode || 'no-tare'
                if (itemTareKey !== tareKey) return true
                return pendingItemIds.has(i.id)
            }),
        )
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
                setSourceItems((prev) => {
                    const existing = new Set(prev.map((i) => i.id))
                    const additions = (items || []).filter(
                        (i) => !existing.has(i.id),
                    )
                    return [...prev, ...additions]
                })
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

    const visibleSourceItems = useMemo(
        () => sourceItems.filter((i) => !pendingItemIds.has(i.id)),
        [sourceItems, pendingItemIds],
    )

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
            const tareById = new Map(targetTares.map((t) => [t.id, t]))
            const moves: RepackMove[] = pending.map((m) => {
                const item = tareById
                    .get(m.targetTareId)
                    ?.items.find((i) => i.id === m.itemId)
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

    const sourceToolbar = (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                flexWrap: 'nowrap',
                mb: 1.5,
            }}
        >
            <Box>
                <Typography sx={monoLabelSx}>
                    Search source tare by barcode
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TareBarcodePicker
                        tareTypeId={sourceSuggestionTareTypeId}
                        nomenclatureId={selectedNomenclatureId}
                        includeFull
                        value={tarePicked}
                        onChange={async (tare) => {
                            setTarePicked(tare)
                            if (!tare?.id) return
                            try {
                                const items = await getData<Item[]>(
                                    `${api.items}/tare/${tare.id}`,
                                )
                                setSourceItems((prev) => {
                                    const existing = new Set(
                                        prev.map((i) => i.id),
                                    )
                                    const additions = (items || []).filter(
                                        (i) => !existing.has(i.id),
                                    )
                                    return [...additions, ...prev]
                                })
                                const key =
                                    tare.id || tare.barcode || 'no-tare'
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
                    <MuiButton
                        variant="outlined"
                        onClick={loadTareByBarcode}
                        disabled={!tareBarcode.trim()}
                    >
                        Find
                    </MuiButton>
                </Box>
            </Box>
            <Box>
                <Typography sx={monoLabelSx}>Nomenclature</Typography>
                <HierarchyPicker
                    data={nomenclatures}
                    value={selectedNomenclatureId}
                    onChange={setSelectedNomenclatureId}
                    width={300}
                    placeholder="Select nomenclature…"
                />
            </Box>
        </Box>
    )

    const targetToolbar = (
        <Box sx={{ mb: 1.5 }}>
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
                    nomenclatureId={selectedNomenclatureId}
                    value={newTarePicked}
                    onChange={async (tare) => {
                        setNewTarePicked(tare)
                        // Existing dropdown pick (has `.id`) auto-adds — no need
                        // to also press "Add tare". Custom-typed values still
                        // go through the button so the operator confirms.
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
                <MuiButton
                    variant="contained"
                    color="info"
                    onClick={autoFill}
                    disabled={
                        sourceItems.length === 0 || targetTares.length === 0
                    }
                >
                    Auto-fill
                </MuiButton>
                <MuiButton
                    variant="contained"
                    color="success"
                    onClick={submitRepack}
                    disabled={pending.length === 0 || submitting}
                >
                    {submitting
                        ? 'Saving…'
                        : `Apply (${pending.length} moves)`}
                </MuiButton>
                <MuiButton
                    variant="outlined"
                    onClick={reset}
                    disabled={pending.length === 0}
                >
                    Reset
                </MuiButton>
                {submitResult &&
                    (submitResult.errors.length === 0 ? (
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'var(--sig-run-deep)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Moved{' '}
                            {formatUnits(
                                submitResult.movedQuantity,
                                submitResult.units,
                                submitResult.countable,
                            )}
                            .
                        </Typography>
                    ) : (
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'var(--sig-fault-deep)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {submitResult.errors[0]}
                        </Typography>
                    ))}
            </Box>
        </Box>
    )

    return (
        <SubRootPage title="Repacking" menuItems={[]}>
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
                    {sourceToolbar}
                    <Paper elevation={0} sx={panelPaperSx}>
                        <Typography component="h3" sx={panelHeadingSx}>
                            Source tares
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
                            <GradeLegend
                                grades={visibleGrades(sourceItems)}
                                onPick={selectByGrade}
                            />
                            <NomenclatureLegend
                                nomenclatures={visibleNomenclatures(
                                    sourceItems,
                                )}
                                onPick={selectByNomenclature}
                            />
                            {selectionLabel && (
                                <Typography
                                    variant="caption"
                                    title="Click an empty target slot to place. Shift+click for range, Ctrl/Cmd+click to toggle. Right-click for more."
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
                        {sourceTares.length === 0 && (
                            <EmptyMsg
                                text={
                                    selectedNomenclatureId
                                        ? 'Pick or scan a tare to add its matching items here.'
                                        : 'Select a nomenclature, then pick a tare to load its items.'
                                }
                            />
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
                                    .filter((a): a is number => a != null),
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
                                        <MuiButton
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                                removeSourceTare(key)
                                            }
                                        >
                                            Remove
                                        </MuiButton>
                                    }
                                />
                            )
                        })}
                    </Paper>
                </SmartScrollContent>

                <SmartScrollContent style={{ flex: 1 }}>
                    {targetToolbar}
                    <Paper elevation={0} sx={panelPaperSx}>
                        <Typography component="h3" sx={panelHeadingSx}>
                            Target tares
                        </Typography>
                        {targetTares.length === 0 && (
                            <EmptyMsg text="Add target tares by barcode search or create new ones" />
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
                                        <MuiButton
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                                removeTargetTare(t.id)
                                            }
                                        >
                                            Remove
                                        </MuiButton>
                                    }
                                />
                            )
                        })}
                    </Paper>
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
        </SubRootPage>
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
