import '@logistics/components/supplies' // side-effect: registers the `supplies` namespace
import { SupplyComponentTab } from '@logistics/components/supplies/SupplyComponentTab'
import type { UUID } from '@logistics/data/types'
import { SmoothTabContainer } from '@microprojects/edm-components/components/master/MasterDetail'
import { Box, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type SupplyTabsProps = {
    id: UUID
    api: string
    onDetailSelected: Function
}

export function SupplyTabs(props: SupplyTabsProps) {
    const { t } = useTranslation('supplies')
    const [selected, setSelected] = useState(0)
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={(_, v) => setSelected(v)}>
                    <Tab label={t('tabs.components')} />
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                <SmoothTabContainer value={selected}>
                    <SupplyComponentTab {...props} />
                </SmoothTabContainer>
            </Box>
        </Box>
    )
}
