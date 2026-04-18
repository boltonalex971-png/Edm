import { ProcessSpecificationTab } from '@logistics/components/config/process/ProcessSpecificationTab.tsx'
import { OrderComponentTab } from '@logistics/components/orders/OrderComponentTab.tsx'
import { OrderOperationTab } from '@logistics/components/orders/OrderOperationTab.tsx'
import { OrderOutputTab } from '@logistics/components/orders/OrderOutputTab.tsx'
import { OrderSpecificationTab } from '@logistics/components/orders/OrderSpecificationTab.tsx'
import type { Order, UUID } from '@logistics/data/types'
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout'
import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { ProcessQualifiersTab } from './ProcessQualifiersTab'
import { ProcessSubProcessesTab } from './ProcessSubProcessesTab.tsx'

type OrderTabsProps = {
    api: string
    id: UUID
    order?: Order
    missedInputs?: string[]
    onDetailSelected: Function
}

export function OrderTabs({ order, ...props }: OrderTabsProps) {
    const [selected, setSelected] = useState(0)
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title={'Operations'}>
                <OrderOperationTab {...props} />
            </TabStripTab>
            <TabStripTab title={'Specification'}>
                <OrderSpecificationTab {...props} />
            </TabStripTab>
            <TabStripTab title={'Components'}>
                <OrderComponentTab {...props} />
            </TabStripTab>
            <TabStripTab title={'Output'}>
                <OrderOutputTab {...props} order={order} />
            </TabStripTab>
        </TabStrip>
    )
}
