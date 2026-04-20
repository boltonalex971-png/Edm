import type { Item } from '@logistics/data/types'
import { formatQuantity } from '@logistics/utils/format'

export type ItemSlotTooltipProps = {
    item: Item
    address?: number
}

export function ItemSlotTooltip({ item, address }: ItemSlotTooltipProps) {
    const hideQty = item.nomenclatureCountable && item.quantity === 1
    return (
        <div className="slot-tooltip">
            {address != null && (
                <div className="slot-tooltip-row">
                    <span className="slot-tooltip-label">Address</span>
                    <span>{address}</span>
                </div>
            )}
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
