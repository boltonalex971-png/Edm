import '@logistics/components/tare' // side-effect: registers the `tare` namespace
import {
    type SlotData,
    TareSchematic,
} from '@logistics/components/tare/TareSchematic'
import {
    type TareGroup,
    tareSummary,
} from '@logistics/components/tare/TareItemsPanel'
import type { Item, UUID } from '@logistics/data/types'
import {
    ExpandMoreOutlined as ChevronDown,
    ChevronRightOutlined as ChevronRight,
} from '@mui/icons-material'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import './TareItemsPanel.css'

type TareGroupRowProps = {
    group: TareGroup
    expanded: boolean
    onToggleExpanded: () => void
    /** Click on the row header (away from the chevron). Defaults to the
     * same behaviour as the chevron — toggle expanded. */
    onRowClick?: () => void
    /** Click on a slot inside the schematic. */
    onSlotClick?: (slot: SlotData, e: React.MouseEvent) => void
    /** Right-click on a slot inside the schematic. */
    onSlotContextMenu?: (slot: SlotData, e: React.MouseEvent) => void
    /** Single-slot highlight. */
    selectedSlot?: number
    /** Multi-slot highlight. */
    selectedSlots?: Set<number>
    /** Optional dim predicate forwarded to TareSchematic. */
    dimItem?: (item: Item) => boolean
    /** Optional mute predicate forwarded to TareSchematic — lighter than dim. */
    mutedItem?: (item: Item) => boolean
    /** Forwarded to TareSchematic — render empty slots prominently. */
    highlightEmpty?: boolean
    /** Optional content rendered at the right end of the row header
     * (e.g. a Remove button for target tares). */
    headerExtra?: React.ReactNode
}

/**
 * One collapsible tare-group row — the same visual + interaction pattern
 * used by `TareItemsPanel` (header chevron + barcode + type + summary,
 * collapsible detail showing a `TareSchematic`). Reused from places that
 * already have the items in memory (Repacking source/target panels).
 */
export const TareGroupRow = ({
    group,
    expanded,
    onToggleExpanded,
    onRowClick,
    onSlotClick,
    onSlotContextMenu,
    selectedSlot,
    selectedSlots,
    dimItem,
    mutedItem,
    highlightEmpty,
    headerExtra,
}: TareGroupRowProps) => {
    const { t } = useTranslation('tare')
    const names = [
        ...new Set(group.items.map((i) => i.nomenclatureName).filter(Boolean)),
    ]
    return (
        <div className="tare-row-group">
            <div
                className="tare-row"
                onClick={() => (onRowClick ?? onToggleExpanded)()}
            >
                <button
                    type="button"
                    className="tare-expand-btn"
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleExpanded()
                    }}
                >
                    {expanded ? (
                        <ChevronDown fontSize="small" />
                    ) : (
                        <ChevronRight fontSize="small" />
                    )}
                </button>
                <span className="tare-row-barcode">
                    {group.tare.barcode || t('picker.noBarcode')}
                </span>
                <span className="tare-row-type">
                    {group.tare.tareTypeName}
                </span>
                <span className="tare-row-nomenclatures">
                    {names.join(', ')}
                </span>
                <span className="tare-row-summary">
                    {tareSummary(group, t)}
                </span>
                {group.tare.tareTypeUnits && (
                    <span className="tare-row-units">
                        {group.tare.tareTypeUnits}
                    </span>
                )}
                {headerExtra && (
                    <span
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'inline-flex' }}
                    >
                        {headerExtra}
                    </span>
                )}
            </div>
            {expanded && (
                <div className="tare-row-detail">
                    <TareSchematic
                        tare={group.tare}
                        items={group.items}
                        selectedSlot={selectedSlot}
                        selectedSlots={selectedSlots}
                        dimItem={dimItem}
                        mutedItem={mutedItem}
                        highlightEmpty={highlightEmpty}
                        onSlotClick={onSlotClick}
                        onSlotContextMenu={onSlotContextMenu}
                    />
                </div>
            )}
        </div>
    )
}
