import type { UUID } from '@logistics/data/types'
import { SmoothTabContainer } from '@microprojects/edm-components/components/master/MasterDetail'
import { Box, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import { TareTypeNomenclaturesTab } from './TareTypeNomenclaturesTab'

type TareTypeTabsProps = {
    id: UUID
    api: string
    onDetailSelected: Function
}

export function TareTypeTabs(props: TareTypeTabsProps) {
    const [selected, setSelected] = useState(0)
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={(_, v) => setSelected(v)}>
                    <Tab label="Allowed nomenclatures" />
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                <SmoothTabContainer value={selected}>
                    <TareTypeNomenclaturesTab {...props} />
                </SmoothTabContainer>
            </Box>
        </Box>
    )
}
