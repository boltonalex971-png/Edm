import { Loading } from '@features/utils/Utils'
import '@logistics/components/tare' // side-effect: registers the `tare` namespace
import { TareGroupRow } from '@logistics/components/tare/TareGroupRow'
import type { Item, TareInfo, UUID } from '@logistics/data/types'
import { useEntityToken } from '@microprojects/edm-components/hooks'
import { useGet } from '@logistics/hooks/hooks'
import { Alert } from '@mui/material'
import type React from 'react'
import { useMemo, useState } from 'react'
import { type TFunction, useTranslation } from 'react-i18next'
import './TareItemsPanel.css'

export type TareGroup = {
    tare: TareInfo
    items: Item[]
}

type TareItemsPanelProps = {
    api: string
    onTareClick?: (group: TareGroup) => void
    onItemClick?: (item: Item) => void
    toolbar?: React.ReactNode
    supplyId?: UUID
}

export function groupByTare(items: Item[]): TareGroup[] {
    const map = new Map<string, TareGroup>()
    for (const item of items) {
        const key = item.tareId || 'no-tare'
        if (!map.has(key)) {
            map.set(key, {
                tare: {
                    id: (item.tareId || '') as UUID,
                    barcode: item.tareBarcode,
                    tareTypeId: (item.tareTareTypeId || '') as UUID,
                    tareTypeName: item.tareTareTypeName,
                    tareTypeUnits: item.tareTareTypeUnits,
                    sizeX: item.tareTareTypeSizeX,
                    sizeY: item.tareTareTypeSizeY,
                    sizeZ: item.tareTareTypeSizeZ,
                    dimensions: item.tareTareTypeDimensions ?? 0,
                    capacity: item.tareTareTypeCapacity ?? 0,
                },
                items: [],
            })
        }
        map.get(key)!.items.push(item)
    }
    return Array.from(map.values())
}

export function tareSummary(
    group: TareGroup,
    t?: TFunction<any, any>,
): string {
    const { tare, items } = group
    const totalQty = items.reduce((s, i) => s + i.quantity, 0)
    if ((tare.sizeX ?? 0) > 0) {
        // Addressed tare: only items pinned to a slot count toward occupancy.
        // Address-less items here are orphans (their nomenclature/tare type
        // shape changed after they were stored) and surface separately.
        const placed = items.filter((i) => i.address != null).length
        const orphans = items.length - placed
        const base = t
            ? t('items.slots', { placed, capacity: Math.floor(tare.capacity) })
            : `${placed} / ${Math.floor(tare.capacity)} slots`
        if (orphans <= 0) return base
        const suffix = t
            ? t('items.orphanSuffix', { count: orphans })
            : ` (+${orphans} orphan)`
        return `${base}${suffix}`
    }
    return t
        ? t('items.bulkQty', { total: totalQty, capacity: tare.capacity })
        : `${totalQty} / ${tare.capacity}`
}

export function TareItemsPanel({
    api,
    onTareClick,
    onItemClick,
    toolbar,
    supplyId,
}: TareItemsPanelProps) {
    const { t } = useTranslation('tare')
    const token = useEntityToken([
        { type: 'item' },
        { type: 'tare' },
        ...(supplyId ? [{ type: 'supply', id: supplyId }] : []),
    ])
    const [[data], loading, error] = useGet<Item[]>(api, [api, token])
    const [expandedTares, setExpandedTares] = useState<Set<string>>(new Set())

    const groups = useMemo(() => groupByTare(data || []), [data])

    const toggleExpand = (tareId: string) => {
        setExpandedTares((prev) => {
            const next = new Set(prev)
            if (next.has(tareId)) {
                next.delete(tareId)
            } else {
                next.add(tareId)
            }
            return next
        })
    }

    return (
        <div className="tare-items-panel">
            {toolbar}
            {error && <Alert severity="error">{error}</Alert>}
            {loading && <Loading />}
            {!loading && groups.length === 0 && (
                <div className="tare-items-empty">{t('items.noItems')}</div>
            )}
            {groups.map((group) => {
                const key = group.tare.id || 'no-tare'
                const expanded = expandedTares.has(key)
                return (
                    <TareGroupRow
                        key={key}
                        group={group}
                        expanded={expanded}
                        onToggleExpanded={() => toggleExpand(key)}
                        onRowClick={() => onTareClick?.(group)}
                        onSlotClick={(slot) => {
                            if (slot.item && onItemClick) {
                                onItemClick(slot.item)
                            }
                        }}
                    />
                )
            })}
        </div>
    )
}
