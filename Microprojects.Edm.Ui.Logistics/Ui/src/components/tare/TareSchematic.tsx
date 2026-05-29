import '@logistics/components/tare' // side-effect: registers the `tare` namespace
import type { Item, TareInfo, UUID } from '@logistics/data/types'
import { Popper } from '@mui/material'
import type React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
    /** Optional right-click handler on a slot. Caller is expected to call
     *  e.preventDefault() to suppress the native menu. */
    onSlotContextMenu?: (slot: SlotData, event: React.MouseEvent) => void
    highlightEmpty?: boolean
    label?: string
    /** Optional tint for occupied slots based on item (e.g. grade color). */
    slotColor?: (item: Item) => string | undefined
    /** Optional predicate to dim slots whose item is "foreign" (e.g. another process). */
    dimItem?: (item: Item) => boolean
    /** Optional predicate to mute slots whose item is in a transient state
     *  (e.g. pending-move pre-Apply). Lighter than `dimItem`: only an
     *  opacity drop, no grayscale. `dimItem` wins if both apply. */
    mutedItem?: (item: Item) => boolean
}

type TooltipState = {
    item: Item
    address: number
    anchor: HTMLElement
}

function BulkTareView({ tare, items }: { tare: TareInfo; items: Item[] }) {
    const { t } = useTranslation('tare')
    const totalQty = items.reduce((s, i) => s + i.quantity, 0)
    const pct = tare.capacity > 0 ? Math.min(totalQty / tare.capacity, 1) : 0
    const fillColor = 'var(--accent)'
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
                    <span style={{ color: 'var(--ink-3)' }}>
                        {t('items.empty')}
                    </span>
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
    muted,
    onSlotClick,
    onSlotContextMenu,
    onMouseEnter,
    onMouseLeave,
}: {
    slot: SlotData
    selected: boolean
    highlightEmpty: boolean
    slotColor?: string
    dimmed?: boolean
    muted?: boolean
    onSlotClick?: (slot: SlotData, event: React.MouseEvent) => void
    onSlotContextMenu?: (slot: SlotData, event: React.MouseEvent) => void
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
        occupied && !dimmed && !selected
            ? {
                  boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.32)',
                  borderColor: 'rgba(0,0,0,0.32)',
              }
            : {}
    // Selected items need a strong, color-independent indicator: an outer
    // ring + thick inner border that wins over the per-grade tint inline
    // style (which would otherwise hide the .tare-slot.selected CSS rule).
    const selectedEmphasis: React.CSSProperties = selected
        ? {
              boxShadow:
                  '0 0 0 2px var(--accent), inset 0 0 0 2px rgba(255,255,255,0.85)',
              borderColor: 'var(--accent)',
          }
        : {}
    const style: React.CSSProperties | undefined = dimmed
        ? {
              filter: 'grayscale(1)',
              opacity: 0.55,
          }
        : occupied
          ? {
                ...(baseStyle ?? {}),
                ...ownEmphasis,
                ...selectedEmphasis,
                ...(muted ? { opacity: 0.55 } : {}),
            }
          : { ...(baseStyle ?? {}), ...selectedEmphasis }
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
            onContextMenu={
                onSlotContextMenu
                    ? (e) => onSlotContextMenu(slot, e)
                    : undefined
            }
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
        onSlotContextMenu,
        highlightEmpty,
        slotColor,
        dimItem,
        mutedItem,
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
        const map = new Map<UUID, { name: string; color?: string }>()
        for (const it of items) {
            if (it.gradeId && it.gradeName && !map.has(it.gradeId)) {
                map.set(it.gradeId, {
                    name: it.gradeName,
                    color: it.gradeColor,
                })
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
                        color: 'var(--ink-2)',
                    }}
                >
                    {presentGrades.map(([id, grade]) => (
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
                                    background:
                                        grade.color ?? 'var(--surface-3)',
                                    border: '1px solid rgba(0,0,0,0.15)',
                                }}
                            />
                            {grade.name}
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
                                            : slot.item.gradeColor
                                        : undefined
                                }
                                dimmed={
                                    slot.item && dimItem
                                        ? dimItem(slot.item)
                                        : false
                                }
                                muted={
                                    slot.item && mutedItem
                                        ? mutedItem(slot.item)
                                        : false
                                }
                                onSlotClick={onSlotClick}
                                onSlotContextMenu={onSlotContextMenu}
                                onMouseEnter={showTooltip}
                                onMouseLeave={hideTooltip}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <BulkTareView tare={tare} items={items} />
            )}
            <Popper
                open={!!tooltip}
                anchorEl={tooltip?.anchor ?? null}
                placement="top"
                modifiers={[
                    { name: 'offset', options: { offset: [0, 6] } },
                    {
                        name: 'flip',
                        options: { fallbackPlacements: ['bottom'] },
                    },
                    {
                        name: 'preventOverflow',
                        options: { boundary: 'viewport', padding: 8 },
                    },
                ]}
                style={{ zIndex: 1500 }}
            >
                {tooltip && (
                    <ItemSlotTooltip
                        item={tooltip.item}
                        address={tooltip.address}
                    />
                )}
            </Popper>
        </div>
    )
}
