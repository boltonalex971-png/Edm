import '@logistics/components/tare/TareSchematic.css'
import type { Item, UUID } from '@logistics/data/types'
import { formatQuantity } from '@logistics/utils/format'
import { colorForGradeId } from '@logistics/utils/gradePalette'
import type React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

type OutputItemsPanelProps = {
    items: Item[]
    selectedIds: Set<UUID>
    onSlotClick: (item: Item, e: React.MouseEvent) => void
    onToggleAll: () => void
    onItemContextMenu?: (item: Item, e: React.MouseEvent) => void
}

type TooltipState = {
    item: Item
    x: number
    y: number
}

function ItemTooltip({ item, x, y }: TooltipState) {
    const hideQty = item.nomenclatureCountable && item.quantity === 1
    return (
        <div className="slot-tooltip" style={{ left: x, top: y }}>
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
            {!hideQty && (
                <div className="slot-tooltip-row">
                    <span className="slot-tooltip-label">Quantity</span>
                    <span>
                        {formatQuantity(
                            item.quantity,
                            item.nomenclatureCountable,
                        )}
                        {item.nomenclatureUnits
                            ? ` ${item.nomenclatureUnits}`
                            : ''}
                    </span>
                </div>
            )}
            {item.gradeName && (
                <div className="slot-tooltip-row">
                    <span className="slot-tooltip-label">Grade</span>
                    <span>{item.gradeName}</span>
                </div>
            )}
        </div>
    )
}

function renderSlotLabel(item: Item) {
    if (item.serialNo) {
        return <span className="slot-serial">{item.serialNo}</span>
    }
    const qty = formatQuantity(item.quantity, item.nomenclatureCountable)
    return (
        <span className="slot-serial">
            {qty}
            {item.nomenclatureUnits ? ` ${item.nomenclatureUnits}` : ''}
        </span>
    )
}

export function OutputItemsPanel({
    items,
    selectedIds,
    onSlotClick,
    onToggleAll,
    onItemContextMenu,
}: OutputItemsPanelProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [tooltip, setTooltip] = useState<TooltipState | null>(null)
    const hideTimer = useRef<ReturnType<typeof setTimeout>>()

    const showTooltip = useCallback((item: Item, e: React.MouseEvent) => {
        clearTimeout(hideTimer.current)
        const rect = containerRef.current?.getBoundingClientRect()
        const target = (e.currentTarget as HTMLElement).getBoundingClientRect()
        if (!rect) return
        setTooltip({
            item,
            x: target.left - rect.left + target.width / 2,
            y: target.top - rect.top - 4,
        })
    }, [])

    const hideTooltip = useCallback(() => {
        hideTimer.current = setTimeout(() => setTooltip(null), 120)
    }, [])

    const allSelected = items.length > 0 && selectedIds.size === items.length
    const someSelected = selectedIds.size > 0 && !allSelected

    const headerLabel = useMemo(() => {
        if (items.length === 0) return ''
        const names = [...new Set(items.map((i) => i.nomenclatureName))]
        return names.length === 1 ? names[0] : 'Mixed nomenclatures'
    }, [items])

    return (
        <div className="tare-schematic" ref={containerRef}>
            <div
                className="tare-header"
                style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}
            >
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: items.length === 0 ? 'default' : 'pointer',
                    }}
                >
                    <input
                        type="checkbox"
                        disabled={items.length === 0}
                        checked={allSelected}
                        ref={(el) => {
                            if (el) el.indeterminate = someSelected
                        }}
                        onChange={onToggleAll}
                    />
                    <span className="tare-label">{headerLabel || 'Outputs'}</span>
                </label>
                <small className="tare-info">
                    {selectedIds.size} of {items.length} selected
                </small>
            </div>
            <div className="tare-flex-grid">
                {items.map((item) => {
                    const color = colorForGradeId(item.gradeId)
                    const selected = selectedIds.has(item.id)
                    return (
                        <div
                            key={item.id}
                            className={[
                                'tare-slot',
                                'occupied',
                                selected ? 'selected' : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            style={
                                color
                                    ? {
                                          background: color,
                                          borderColor: color,
                                      }
                                    : undefined
                            }
                            onClick={(e) => onSlotClick(item, e)}
                            onContextMenu={
                                onItemContextMenu
                                    ? (e) => onItemContextMenu(item, e)
                                    : undefined
                            }
                            onMouseEnter={(e) => showTooltip(item, e)}
                            onMouseLeave={hideTooltip}
                        >
                            {renderSlotLabel(item)}
                        </div>
                    )
                })}
            </div>
            {tooltip && <ItemTooltip {...tooltip} />}
        </div>
    )
}
