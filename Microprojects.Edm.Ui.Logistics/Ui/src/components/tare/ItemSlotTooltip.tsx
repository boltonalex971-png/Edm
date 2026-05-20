import '@logistics/components/tare' // side-effect: registers the `tare` namespace
import type { Item } from '@logistics/data/types'
import { formatQuantity } from '@logistics/utils/format'
import { useTranslation } from 'react-i18next'

export type ItemSlotTooltipProps = {
    item: Item
    address?: number
}

export function ItemSlotTooltip({ item, address }: ItemSlotTooltipProps) {
    const { t } = useTranslation('tare')
    const hideQty = item.nomenclatureCountable && item.quantity === 1
    return (
        <div className="slot-tooltip">
            {address != null && (
                <div className="slot-tooltip-row">
                    <span className="slot-tooltip-label">
                        {t('tooltip.address')}
                    </span>
                    <span>{address}</span>
                </div>
            )}
            <div className="slot-tooltip-row">
                <span className="slot-tooltip-label">
                    {t('tooltip.nomenclature')}
                </span>
                <span>{item.nomenclatureName}</span>
            </div>
            {item.serialNo && (
                <div className="slot-tooltip-row">
                    <span className="slot-tooltip-label">
                        {t('tooltip.serialNo')}
                    </span>
                    <span>{item.serialNo}</span>
                </div>
            )}
            {!hideQty && (
                <div className="slot-tooltip-row">
                    <span className="slot-tooltip-label">
                        {t('tooltip.quantity')}
                    </span>
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
                    <span className="slot-tooltip-label">
                        {t('tooltip.grade')}
                    </span>
                    <span>{item.gradeName}</span>
                </div>
            )}
        </div>
    )
}
