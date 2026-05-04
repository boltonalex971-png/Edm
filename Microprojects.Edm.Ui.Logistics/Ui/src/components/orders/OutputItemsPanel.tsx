import { ItemSlotTooltip } from '@logistics/components/tare/ItemSlotTooltip'
import '@logistics/components/tare/TareSchematic.css'
import type { Item, UUID } from '@logistics/data/types'
import { formatQuantity } from '@logistics/utils/format'
import { colorForGradeId } from '@logistics/utils/gradePalette'
import { Popup } from '@progress/kendo-react-popup'
import type React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

type OutputItemsPanelProps = {
    items: Item[]
    onSlotClick: (item: Item, e: React.MouseEvent) => void
    /** Selection state — omit in read-only usages (the header checkbox is hidden). */
    selectedIds?: Set<UUID>
    onToggleAll?: () => void
    onItemContextMenu?: (item: Item, e: React.MouseEvent) => void
}

type TooltipState = {
    item: Item
    anchor: HTMLElement
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
    const [tooltip, setTooltip] = useState<TooltipState | null>(null)
    const hideTimer = useRef<ReturnType<typeof setTimeout>>()

    const showTooltip = useCallback((item: Item, e: React.MouseEvent) => {
        clearTimeout(hideTimer.current)
        setTooltip({ item, anchor: e.currentTarget as HTMLElement })
    }, [])

    const hideTooltip = useCallback(() => {
        hideTimer.current = setTimeout(() => setTooltip(null), 120)
    }, [])

    const selectable = !!onToggleAll
    const selectedSet = selectedIds ?? new Set<UUID>()
    const allSelected = items.length > 0 && selectedSet.size === items.length
    const someSelected = selectedSet.size > 0 && !allSelected

    const headerLabel = useMemo(() => {
        if (items.length === 0) return ''
        const names = [...new Set(items.map((i) => i.nomenclatureName))]
        return names.length === 1 ? names[0] : 'Mixed nomenclatures'
    }, [items])

    return (
        <div className="tare-schematic">
            <div
                className="tare-header"
                style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}
            >
                {selectable ? (
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
                        <span className="tare-label">
                            {headerLabel || 'Outputs'}
                        </span>
                    </label>
                ) : (
                    <span className="tare-label">
                        {headerLabel || 'Outputs'}
                    </span>
                )}
                <small className="tare-info">
                    {selectable
                        ? `${selectedSet.size} of ${items.length} selected`
                        : `${items.length} item${items.length === 1 ? '' : 's'}`}
                </small>
            </div>
            <div className="tare-flex-grid">
                {items.map((item) => {
                    const color = colorForGradeId(item.gradeId)
                    const selected = selectedSet.has(item.id)
                    // Selection indicator stays color-independent — the
                    // grade tint is set inline so it would otherwise hide
                    // the .tare-slot.selected CSS rule. Same recipe as
                    // TareSchematic so both screens read identically.
                    const selectedStyle: React.CSSProperties = selected
                        ? {
                              boxShadow:
                                  '0 0 0 2px #1976d2, inset 0 0 0 2px rgba(255,255,255,0.85)',
                              borderColor: '#1976d2',
                          }
                        : {}
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
                            style={{
                                ...(color
                                    ? {
                                          background: color,
                                          borderColor: color,
                                      }
                                    : {}),
                                ...selectedStyle,
                            }}
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
            <Popup
                anchor={tooltip?.anchor}
                show={!!tooltip}
                anchorAlign={{ horizontal: 'center', vertical: 'top' }}
                popupAlign={{ horizontal: 'center', vertical: 'bottom' }}
                collision={{ horizontal: 'fit', vertical: 'flip' }}
                animate={false}
            >
                {tooltip && <ItemSlotTooltip item={tooltip.item} />}
            </Popup>
        </div>
    )
}
