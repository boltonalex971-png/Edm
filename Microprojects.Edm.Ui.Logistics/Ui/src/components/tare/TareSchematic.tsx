import type { Item, TareInfo } from '@logistics/data/types'
import type React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import './TareSchematic.css'

export type SlotData = {
    address: number
    item?: Item
}

type TareSchematicProps = {
    tare: TareInfo
    items: Item[]
    selectedSlot?: number
    selectedSlots?: Set<number>
    onSlotClick?: (slot: SlotData, event: React.MouseEvent) => void
    highlightEmpty?: boolean
    label?: string
}

type TooltipState = {
    item: Item
    address: number
    x: number
    y: number
}

function SlotTooltip({ item, address, x, y }: TooltipState) {
    return (
        <div className="slot-tooltip" style={{ left: x, top: y }}>
            <div className="slot-tooltip-row">
                <span className="slot-tooltip-label">Address</span>
                <span>{address}</span>
            </div>
            <div className="slot-tooltip-row">
                <span className="slot-tooltip-label">Nomenclature</span>
                <span>{item.nomenclatureName}</span>
            </div>
            {item.serialNo && (
                <div className="slot-tooltip-row">
                    <span className="slot-tooltip-label">Serial No</span>
                    <span>{item.serialNo}</span>
                </div>
            )}
            <div className="slot-tooltip-row">
                <span className="slot-tooltip-label">Quantity</span>
                <span>{item.quantity}</span>
            </div>
        </div>
    )
}

function BulkTareView({ tare, items }: { tare: TareInfo; items: Item[] }) {
    const totalQty = items.reduce((s, i) => s + i.quantity, 0)
    const pct = tare.capacity > 0 ? Math.min(totalQty / tare.capacity, 1) : 0
    const fillColor = '#90caf9'
    const names = [...new Set(items.map((i) => i.nomenclatureName))].join(', ')

    return (
        <div className="tare-bulk-bar">
            <div
                className="tare-bulk-fill"
                style={{ width: `${pct * 100}%`, backgroundColor: fillColor }}
            />
            <div className="tare-bulk-content">
                {items.length > 0 ? (
                    <>
                        <span className="bulk-names">{names}</span>
                        <span className="bulk-qty">
                            {totalQty} / {tare.capacity}
                            {tare.tareTypeUnits && ` ${tare.tareTypeUnits}`}
                        </span>
                    </>
                ) : (
                    <span style={{ color: '#999' }}>Empty</span>
                )}
            </div>
        </div>
    )
}

function SlotCell({
    slot,
    selected,
    highlightEmpty,
    onSlotClick,
    onMouseEnter,
    onMouseLeave,
}: {
    slot: SlotData
    selected: boolean
    highlightEmpty: boolean
    onSlotClick?: (slot: SlotData, event: React.MouseEvent) => void
    onMouseEnter: (slot: SlotData, e: React.MouseEvent) => void
    onMouseLeave: () => void
}) {
    const occupied = !!slot.item
    const empty = !occupied && highlightEmpty
    return (
        <div
            className={[
                'tare-slot',
                occupied ? 'occupied' : 'empty',
                selected ? 'selected' : '',
                empty ? 'highlight-empty' : '',
            ].join(' ')}
            onClick={(e) => onSlotClick?.(slot, e)}
            onMouseEnter={(e) => onMouseEnter(slot, e)}
            onMouseLeave={onMouseLeave}
        >
            <span className="slot-address">{slot.address}</span>
            {occupied && slot.item!.serialNo && (
                <span className="slot-serial">{slot.item!.serialNo}</span>
            )}
        </div>
    )
}

export const TareSchematic = (props: TareSchematicProps) => {
    const {
        tare,
        items,
        selectedSlot,
        selectedSlots,
        onSlotClick,
        highlightEmpty,
        label,
    } = props
    const sx = tare.sizeX ?? 0
    const sy = tare.sizeY ?? 0
    const sz = tare.sizeZ ?? 0
    const isDimensional = sx > 0
    const capacity = Math.max(1, Math.floor(tare.capacity))

    const containerRef = useRef<HTMLDivElement>(null)
    const [tooltip, setTooltip] = useState<TooltipState | null>(null)
    const hideTimer = useRef<ReturnType<typeof setTimeout>>()
    const [activeLayer, setActiveLayer] = useState(1)

    const showTooltip = useCallback((slot: SlotData, e: React.MouseEvent) => {
        if (!slot.item) return
        clearTimeout(hideTimer.current)
        const rect = containerRef.current?.getBoundingClientRect()
        const target = (e.currentTarget as HTMLElement).getBoundingClientRect()
        if (!rect) return
        setTooltip({
            item: slot.item,
            address: slot.address,
            x: target.left - rect.left + target.width / 2,
            y: target.top - rect.top - 4,
        })
    }, [])

    const hideTooltip = useCallback(() => {
        hideTimer.current = setTimeout(() => setTooltip(null), 120)
    }, [])

    const allSlots: SlotData[] = useMemo(() => {
        if (!isDimensional) return []
        const result: SlotData[] = []
        for (let addr = 1; addr <= capacity; addr++) {
            const item = items.find((i) => i.address === addr)
            result.push({ address: addr, item })
        }
        return result
    }, [items, capacity, isDimensional])

    const cols = sx
    const rows = sy > 0 ? sy : 1
    const layers = sz > 0 ? sz : 1
    const sliceSize = cols * rows
    const is1d = sy <= 0
    const has3d = sz > 0

    const layerSlots = useMemo(() => {
        if (!isDimensional) return []
        const start = (activeLayer - 1) * sliceSize
        return allSlots.slice(start, start + sliceSize)
    }, [allSlots, activeLayer, sliceSize, isDimensional])

    const isSelected = (addr: number) =>
        selectedSlot === addr || (selectedSlots?.has(addr) ?? false)

    const sizeLabel = [sx, sy > 0 ? sy : null, sz > 0 ? sz : null]
        .filter((v) => v != null)
        .join('\u00d7')

    return (
        <div className="tare-schematic" ref={containerRef}>
            <div className="tare-header">
                <span className="tare-label">
                    {label || tare.barcode || 'Tare'}
                </span>
                <small className="tare-info">
                    {tare.tareTypeName} &middot; {capacity} slots
                    {sizeLabel && <> ({sizeLabel})</>}
                </small>
            </div>
            {isDimensional ? (
                <div className={has3d ? 'tare-3d-layout' : undefined}>
                    {has3d && (
                        <div className="tare-layer-tabs">
                            {Array.from(
                                { length: layers },
                                (_, i) => i + 1,
                            ).map((l) => (
                                <button
                                    key={l}
                                    type="button"
                                    className={`tare-layer-btn${l === activeLayer ? ' active' : ''}`}
                                    onClick={() => setActiveLayer(l)}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    )}
                    <div
                        className={is1d ? 'tare-flex-grid' : 'tare-grid'}
                        style={
                            is1d
                                ? undefined
                                : {
                                      gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                  }
                        }
                    >
                        {layerSlots.map((slot) => (
                            <SlotCell
                                key={slot.address}
                                slot={slot}
                                selected={isSelected(slot.address)}
                                highlightEmpty={highlightEmpty ?? false}
                                onSlotClick={onSlotClick}
                                onMouseEnter={showTooltip}
                                onMouseLeave={hideTooltip}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <BulkTareView tare={tare} items={items} />
            )}
            {tooltip && <SlotTooltip {...tooltip} />}
        </div>
    )
}
