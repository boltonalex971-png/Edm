import { Loading } from '@features/utils/Utils'
import {
    type SlotData,
    TareSchematic,
} from '@logistics/components/tare/TareSchematic'
import type { Item, TareInfo, UUID } from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks'
import type React from 'react'
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'react-bootstrap-icons'
import { Alert } from 'reactstrap'
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

export function tareSummary(group: TareGroup): string {
    const { tare, items } = group
    const totalQty = items.reduce((s, i) => s + i.quantity, 0)
    if ((tare.sizeX ?? 0) > 0) {
        return `${items.length} / ${Math.floor(tare.capacity)} slots`
    }
    return `${totalQty} / ${tare.capacity}`
}

export function TareItemsPanel({
    api,
    onTareClick,
    onItemClick,
    toolbar,
}: TareItemsPanelProps) {
    const [reload, setReload] = useState(false)
    const [[data], loading, error] = useGet<Item[]>(api, [reload, api])
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
            {error && <Alert color="danger">{error}</Alert>}
            {loading && <Loading />}
            {!loading && groups.length === 0 && (
                <div className="tare-items-empty">No items</div>
            )}
            {groups.map((group) => {
                const key = group.tare.id || 'no-tare'
                const expanded = expandedTares.has(key)
                return (
                    <div key={key} className="tare-row-group">
                        <div
                            className="tare-row"
                            onClick={() => onTareClick?.(group)}
                        >
                            <button
                                type="button"
                                className="tare-expand-btn"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleExpand(key)
                                }}
                            >
                                {expanded ? (
                                    <ChevronDown size={14} />
                                ) : (
                                    <ChevronRight size={14} />
                                )}
                            </button>
                            <span className="tare-row-barcode">
                                {group.tare.barcode || '(no barcode)'}
                            </span>
                            <span className="tare-row-type">
                                {group.tare.tareTypeName}
                            </span>
                            <span className="tare-row-nomenclatures">
                                {[
                                    ...new Set(
                                        group.items.map(
                                            (i) => i.nomenclatureName,
                                        ),
                                    ),
                                ].join(', ')}
                            </span>
                            <span className="tare-row-summary">
                                {tareSummary(group)}
                            </span>
                            {group.tare.tareTypeUnits && (
                                <span className="tare-row-units">
                                    {group.tare.tareTypeUnits}
                                </span>
                            )}
                        </div>
                        {expanded && (
                            <div className="tare-row-detail">
                                <TareSchematic
                                    tare={group.tare}
                                    items={group.items}
                                    onSlotClick={(
                                        slot: SlotData,
                                        _e: React.MouseEvent,
                                    ) => {
                                        if (slot.item && onItemClick) {
                                            onItemClick(slot.item)
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
