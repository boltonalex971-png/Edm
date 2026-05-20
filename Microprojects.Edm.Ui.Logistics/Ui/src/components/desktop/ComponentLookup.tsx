import api from '@features/api/api.ts'
import '@logistics/components/desktop' // side-effect: registers the `desktop` namespace
import {
    type TareGroup,
    groupByTare,
    tareSummary,
} from '@logistics/components/tare/TareItemsPanel'
import {
    type SlotData,
    TareSchematic,
} from '@logistics/components/tare/TareSchematic'
import type {
    AllocateItemsRequest,
    AllocateItemsResult,
    Item,
    OrderSpecification,
    UUID,
} from '@logistics/data/types'
import { postData } from '@logistics/hooks/hooks'
import { useSlotSelection } from '@logistics/hooks/useSlotSelection'
import {
    ExpandLessOutlined as ExpandIcon,
    ExpandMoreOutlined as CollapseIcon,
} from '@mui/icons-material'
import {
    Alert,
    Box,
    Button as MuiButton,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

type ComponentLookupProps = {
    orderId: UUID
    spec: OrderSpecification
    onClose: () => void
    onAllocated: (result?: AllocateItemsResult) => void
}

export const ComponentLookup = ({
    orderId,
    spec,
    onClose,
    onAllocated,
}: ComponentLookupProps) => {
    const { t } = useTranslation('desktop')
    const { t: tTare } = useTranslation('tare')
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const {
        selected,
        setSelected,
        handleClick: onItemClickInTare,
    } = useSlotSelection(items)
    const [error, setError] = useState<string | undefined>()
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    // Click-vs-double-click timer so a double-click (select-all) cancels the
    // pending single-click (toggle-expand).
    const pendingRowClickRef = useRef<{
        key: string
        timer: ReturnType<typeof setTimeout>
    } | null>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError(undefined)
            try {
                const found = await postData<Item[]>(
                    `${api.items}/search`,
                    {
                        nomenclatureId: spec.nomenclatureId,
                        active: true,
                    },
                )
                if (!cancelled) {
                    setItems(found ?? [])
                    const groups = groupByTare(found ?? [])
                    setExpanded(
                        new Set(groups.map((g) => g.tare.id || 'no-tare')),
                    )
                }
            } catch (e) {
                if (!cancelled)
                    setError(
                        (e as { message?: string })?.message ||
                            t('lookup.failedToLoad'),
                    )
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [spec.nomenclatureId, t])

    const groups: TareGroup[] = useMemo(() => groupByTare(items), [items])

    const toggleExpand = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const onSlotClick = (
        group: TareGroup,
        slot: SlotData,
        e: React.MouseEvent,
    ) => {
        if (!slot.item) return
        const tareKey = group.tare.id || 'no-tare'
        onItemClickInTare(slot.item, e, tareKey)
    }

    const selectWholeTare = (group: TareGroup) => {
        setSelected((prev) => {
            const next = new Set(prev)
            for (const item of group.items) next.add(item.id)
            return next
        })
    }

    const cancelPendingRowClick = () => {
        if (pendingRowClickRef.current) {
            clearTimeout(pendingRowClickRef.current.timer)
            pendingRowClickRef.current = null
        }
    }

    const onRowClick = (key: string) => {
        cancelPendingRowClick()
        const timer = setTimeout(() => {
            toggleExpand(key)
            pendingRowClickRef.current = null
        }, 220)
        pendingRowClickRef.current = { key, timer }
    }

    const onRowDoubleClick = (group: TareGroup) => {
        cancelPendingRowClick()
        selectWholeTare(group)
    }

    const submit = async () => {
        if (selected.size === 0) return
        setSubmitting(true)
        setError(undefined)
        try {
            const ids = items
                .filter((i) => selected.has(i.id))
                .sort((a, b) => (a.address ?? 0) - (b.address ?? 0))
                .map((i) => i.id)
            const request: AllocateItemsRequest = { itemIds: ids }
            const result = await postData<AllocateItemsResult>(
                `${api.orders}/${orderId}/items/batch`,
                request,
            )
            onAllocated(result)
            onClose()
        } catch (e) {
            setError(
                (e as { message?: string })?.message ||
                    t('lookup.failedToAllocate'),
            )
        } finally {
            setSubmitting(false)
        }
    }

    const totalSelectedQty = useMemo(
        () =>
            items
                .filter((i) => selected.has(i.id))
                .reduce((s, i) => s + (i.quantity ?? 0), 0),
        [items, selected],
    )

    const remaining = spec.amount - spec.total

    return (
        <Dialog
            open
            onClose={onClose}
            fullWidth
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: 'min(800px, 92vw)',
                    maxHeight: '85vh',
                    background: 'var(--surface)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 'var(--r-2)',
                    boxShadow: 'var(--elev-3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 1,
                    py: 1,
                    px: 1.5,
                    background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--line)',
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: 'var(--ink-1)',
                        }}
                    >
                        {t('lookup.title', {
                            name:
                                spec.nomenclatureName ??
                                t('lookup.nomenclatureFallback'),
                        })}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ color: 'var(--ink-3)' }}
                    >
                        {t('lookup.summary', {
                            required: spec.amount,
                            allocated: spec.total,
                            remaining: Math.max(remaining, 0),
                        })}
                    </Typography>
                </Box>
                {selected.size > 0 && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'var(--accent)',
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                        }}
                    >
                        {t('lookup.selectionSummary', {
                            count: selected.size,
                            qty: totalSelectedQty,
                        })}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent
                sx={{
                    flex: 1,
                    minHeight: 0,
                    p: 1,
                    overflow: 'auto',
                }}
            >
                {error && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'var(--ink-3)',
                            py: 2,
                            justifyContent: 'center',
                        }}
                    >
                        <CircularProgress size={14} />
                        <Typography variant="caption">
                            {t('common:loading')}
                        </Typography>
                    </Box>
                )}
                {!loading && groups.length === 0 && (
                    <Box
                        sx={{
                            py: 2,
                            textAlign: 'center',
                            color: 'var(--ink-3)',
                            fontStyle: 'italic',
                        }}
                    >
                        {t('lookup.noAvailable')}
                    </Box>
                )}
                {groups.map((group) => {
                    const key = group.tare.id || 'no-tare'
                    const isExpanded = expanded.has(key)
                    const selectedAddresses = new Set(
                        group.items
                            .filter((i) => selected.has(i.id))
                            .map((i) => i.address)
                            .filter((a): a is number => a != null),
                    )
                    const allSelected = group.items.every((i) =>
                        selected.has(i.id),
                    )
                    const Icon = isExpanded ? ExpandIcon : CollapseIcon
                    return (
                        <Box
                            key={key}
                            sx={{
                                borderBottom: '1px solid var(--line)',
                                background: allSelected
                                    ? 'var(--accent-tint)'
                                    : 'transparent',
                            }}
                        >
                            <Box
                                onClick={() => onRowClick(key)}
                                onDoubleClick={() => onRowDoubleClick(group)}
                                title={t('lookup.rowHint')}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 1,
                                    py: 0.75,
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    '&:hover': {
                                        background: allSelected
                                            ? 'var(--accent-tint)'
                                            : 'var(--surface-2)',
                                    },
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleExpand(key)
                                    }}
                                    sx={{ p: 0.25 }}
                                >
                                    <Icon
                                        fontSize="small"
                                        sx={{ color: 'var(--ink-3)' }}
                                    />
                                </IconButton>
                                <Typography
                                    sx={{
                                        minWidth: 120,
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: 'var(--ink-1)',
                                    }}
                                >
                                    {group.tare.barcode || t('lookup.noBarcode')}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'var(--ink-3)' }}
                                >
                                    {group.tare.tareTypeName}
                                </Typography>
                                <Box sx={{ flex: 1 }} />
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'var(--ink-3)' }}
                                >
                                    {tareSummary(group, tTare)}
                                </Typography>
                            </Box>
                            {isExpanded && (
                                <Box sx={{ px: 1, pb: 1 }}>
                                    <TareSchematic
                                        tare={group.tare}
                                        items={group.items}
                                        selectedSlots={selectedAddresses}
                                        onSlotClick={(slot, e) =>
                                            onSlotClick(group, slot, e)
                                        }
                                    />
                                </Box>
                            )}
                        </Box>
                    )
                })}
            </DialogContent>

            <DialogActions
                sx={{
                    px: 1.5,
                    py: 1,
                    borderTop: '1px solid var(--line)',
                    background: 'var(--surface-2)',
                }}
            >
                <MuiButton variant="outlined" onClick={onClose}>
                    {t('common:cancel')}
                </MuiButton>
                <MuiButton
                    variant="contained"
                    color="primary"
                    onClick={submit}
                    disabled={selected.size === 0 || submitting}
                >
                    {submitting
                        ? t('lookup.allocating')
                        : t('lookup.allocate', { count: selected.size })}
                </MuiButton>
            </DialogActions>
        </Dialog>
    )
}
