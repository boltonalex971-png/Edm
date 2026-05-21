import '@logistics/components/orders' // side-effect: registers the `orders` namespace
import { OrderComponentTab } from '@logistics/components/orders/OrderComponentTab.tsx'
import { OrderOperationTab } from '@logistics/components/orders/OrderOperationTab.tsx'
import { OrderOutputTab } from '@logistics/components/orders/OrderOutputTab.tsx'
import { OrderSpecificationTab } from '@logistics/components/orders/OrderSpecificationTab.tsx'
import type { Order, UUID } from '@logistics/data/types'
import { SmoothTabContainer } from '@microprojects/edm-components/components/master/MasterDetail'
import { Box, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type OrderTabsProps = {
    api: string
    id: UUID
    order?: Order
    missedInputs?: string[]
    onDetailSelected: Function
}

export function OrderTabs({ order, ...props }: OrderTabsProps) {
    const [selected, setSelected] = useState(0)
    const { t } = useTranslation('orders')
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={(_, v) => setSelected(v)}>
                    <Tab label={t('tabs.operations', 'Operations')} />
                    <Tab label={t('tabs.specification', 'Specification')} />
                    <Tab label={t('tabs.components', 'Components')} />
                    <Tab label={t('tabs.output', 'Output')} />
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
