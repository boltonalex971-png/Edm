import { OrderComponentTab } from '@logistics/components/orders/OrderComponentTab.tsx'
import { OrderOperationTab } from '@logistics/components/orders/OrderOperationTab.tsx'
import { OrderOutputTab } from '@logistics/components/orders/OrderOutputTab.tsx'
import { OrderSpecificationTab } from '@logistics/components/orders/OrderSpecificationTab.tsx'
import type { Order, UUID } from '@logistics/data/types'
import { SmoothTabContainer } from '@microprojects/edm-components/components/master/MasterDetail'
import { Box, Tab, Tabs } from '@mui/material'
import { useState } from 'react'

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
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={(_, v) => setSelected(v)}>
                    <Tab label="Operations" />
                    <Tab label="Specification" />
                    <Tab label="Components" />
                    <Tab label="Output" />
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                <SmoothTabContainer value={selected}>
                    <OrderOperationTab {...props} />
                    <OrderSpecificationTab {...props} />
                    <OrderComponentTab {...props} />
                    <OrderOutputTab {...props} order={order} />
                </SmoothTabContainer>
            </Box>
        </Box>
    )
}
