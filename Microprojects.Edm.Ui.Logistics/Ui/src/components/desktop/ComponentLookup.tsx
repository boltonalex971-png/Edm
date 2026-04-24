import api from '@features/api/api.ts'
import styles from '@logistics/components/desktop/desktop.module.css'
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
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight } from 'react-bootstrap-icons'

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
                const found = await postData<Item[]>(`${api.items}/search`, {
                    nomenclatureId: spec.nomenclatureId,
                    active: true,
                })
                if (!cancelled) {
                    setItems(found ?? [])
                    // Auto-expand all tares so the operator immediately sees
                    // schematics — kiosk-friendly default.
                    const groups = groupByTare(found ?? [])
                    setExpanded(
                        new Set(groups.map((g) => g.tare.id || 'no-tare')),
                    )
                }
            } catch (e) {
                if (!cancelled)
                    setError(
                        (e as { message?: string })?.message ||
                            'Failed to load items',
                    )
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [spec.nomenclatureId])

    const groups: TareGroup[] = useMemo(() => groupByTare(items), [items])

    const toggleExpand = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    // Per-tare scoped selection: shift-range only kicks in when both clicks
    // happen in the same tare. The hook (useSlotSelection) does the rest.
    const onSlotClick = (group: TareGroup, slot: SlotData, e: React.MouseEvent) => {
        if (!slot.item) return
        const tareKey = group.tare.id || 'no-tare'
        onItemClickInTare(slot.item, e, tareKey)
    }

    // Double-click a tare row → select all its items at once.
    const selectWholeTare = (group: TareGroup) => {
        setSelected((prev) => {
            const next = new Set(prev)
            for (const item of group.items) {
                next.add(item.id)
            }
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
            // Sort by address so allocation order matches the visual order
            // (mirrors ItemSearch.allocateSelected).
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
                    'Failed to allocate items',
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
        <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            onClick={onClose}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose()
            }}
        >
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="document"
            >
                <div className={styles.modalHeader}>
                    <div>
                        <div className={styles.modalTitle}>
                            Pick items — {spec.nomenclatureName ?? 'Nomenclature'}
                        </div>
                        <div className={styles.modalSub}>
                            Required {spec.amount} · already allocated{' '}
                            {spec.total} · need {Math.max(remaining, 0)} more
                        </div>
                    </div>
                    {selected.size > 0 && (
                        <div className={styles.modalSub}>
                            {selected.size} selected · {totalSelectedQty} qty
                        </div>
                    )}
                </div>

                {error && <div className={styles.errorMsg}>{error}</div>}

                <div className={styles.modalBody}>
                    {loading && (
                        <div className={styles.sectionEmpty}>Loading…</div>
                    )}
                    {!loading && groups.length === 0 && (
                        <div className={styles.sectionEmpty}>
                            No available items for this nomenclature.
                        </div>
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
                        return (
                            <div
                                key={key}
                                style={{
                                    borderBottom: '1px solid #f0f0f0',
                                }}
                            >
                                <div
                                    className={styles.lookupRow}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        padding: '0.55rem 0.7rem',
                                        background: allSelected
                                            ? '#e3f2fd'
                                            : undefined,
                                    }}
                                    onClick={() => onRowClick(key)}
                                    onDoubleClick={() => onRowDoubleClick(group)}
                                    title="Click to expand · double-click to select all"
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleExpand(key)
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 0,
                                            cursor: 'pointer',
                                            padding: 0,
                                            display: 'flex',
                                        }}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={14} />
                                        ) : (
                                            <ChevronRight size={14} />
                                        )}
                                    </button>
                                    <strong style={{ minWidth: 120 }}>
                                        {group.tare.barcode || '(no barcode)'}
                                    </strong>
                                    <span
                                        style={{
                                            color: '#666',
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {group.tare.tareTypeName}
                                    </span>
                                    <span style={{ flex: 1 }} />
                                    <span
                                        style={{
                                            color: '#666',
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {tareSummary(group)}
                                    </span>
                                </div>
                                {isExpanded && (
                                    <div style={{ padding: '0 0.7rem 0.7rem' }}>
                                        <TareSchematic
                                            tare={group.tare}
                                            items={group.items}
                                            selectedSlots={selectedAddresses}
                                            onSlotClick={(slot, e) =>
                                                onSlotClick(group, slot, e)
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={styles.primary}
                        onClick={submit}
                        disabled={selected.size === 0 || submitting}
                    >
                        {submitting
                            ? 'Allocating…'
                            : `Allocate ${selected.size}`}
                    </button>
                </div>
            </div>
        </div>
    )
}
