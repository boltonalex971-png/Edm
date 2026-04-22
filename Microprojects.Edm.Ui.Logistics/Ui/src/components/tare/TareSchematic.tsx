import type { Item, TareInfo, UUID } from '@logistics/data/types'
import { colorForGradeId } from '@logistics/utils/gradePalette'
import { Popup } from '@progress/kendo-react-popup'
import type React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ItemSlotTooltip } from './ItemSlotTooltip'
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
    /** Optional tint for occupied slots based on item (e.g. grade color). */
    slotColor?: (item: Item) => string | undefined
    /** Optional predicate to dim slots whose item is "foreign" (e.g. another process). */
    dimItem?: (item: Item) => boolean
}

type TooltipState = {
    item: Item
    address: number
    anchor: HTMLElement
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
    slotColor,
    dimmed,
    onSlotClick,
    onMouseEnter,
    onMouseLeave,
}: {
    slot: SlotData
    selected: boolean
    highlightEmpty: boolean
    slotColor?: string
    dimmed?: boolean
    onSlotClick?: (slot: SlotData, event: React.MouseEvent) => void
    onMouseEnter: (slot: SlotData, e: React.MouseEvent) => void
    onMouseLeave: () => void
}) {
    const occupied = !!slot.item
    const empty = !occupied && highlightEmpty
    const baseStyle: React.CSSProperties | undefined =
        occupied && slotColor
            ? { background: slotColor, borderColor: slotColor }
            : undefined
    const ownEmphasis: React.CSSProperties =
        occupied && !dimmed
            ? {
                  boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.32)',
                  borderColor: 'rgba(0,0,0,0.32)',
              }
            : {}
    const style: React.CSSProperties | undefined = dimmed
        ? {
              filter: 'grayscale(1)',
              opacity: 0.55,
          }
        : occupied
          ? { ...(baseStyle ?? {}), ...ownEmphasis }
          : baseStyle
    return (
        <div
            className={[
                'tare-slot',
                occupied ? 'occupied' : 'empty',
                selected ? 'selected' : '',
                empty ? 'highlight-empty' : '',
            ].join(' ')}
            style={style}
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
        slotColor,
        dimItem,
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
        setTooltip({
            item: slot.item,
            address: slot.address,
            anchor: e.currentTarget as HTMLElement,
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

    const presentGrades = useMemo(() => {
        const map = new Map<UUID, string>()
        for (const it of items) {
            if (it.gradeId && it.gradeName && !map.has(it.gradeId)) {
                map.set(it.gradeId, it.gradeName)
            }
        }
        return [...map.entries()]
    }, [items])

    return (
        <div className="tare-schematic" ref={containerRef}>
            {presentGrades.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '0.4rem',
                        fontSize: '0.78rem',
                        color: '#555',
                    }}
                >
                    {presentGrades.map(([id, name]) => (
                        <span
                            key={id}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                            }}
                        >
                            <span
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 2,
                                    background: colorForGradeId(id) ?? '#eee',
                                    border: '1px solid rgba(0,0,0,0.15)',
                                }}
                            />
                            {name}
                        </span>
                    ))}
                </div>
            )}
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
                                slotColor={
                                    slot.item
                                        ? slotColor
                                            ? slotColor(slot.item)
                                            : colorForGradeId(slot.item.gradeId)
                                        : undefined
                                }
                                dimmed={
                                    slot.item && dimItem
                                        ? dimItem(slot.item)
                                        : false
                                }
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
            <Popup
                anchor={tooltip?.anchor}
                show={!!tooltip}
                anchorAlign={{ horizontal: 'center', vertical: 'top' }}
                popupAlign={{ horizontal: 'center', vertical: 'bottom' }}
                collision={{ horizontal: 'fit', vertical: 'flip' }}
                animate={false}
            >
                {tooltip && (
                    <ItemSlotTooltip
                        item={tooltip.item}
                        address={tooltip.address}
                    />
                )}
            </Popup>
        </div>
    )
}
