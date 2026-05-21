import { ProcessGradesTab } from '@logistics/components/config/process/ProcessGradesTab.tsx'
import { ProcessSpecificationTab } from '@logistics/components/config/process/ProcessSpecificationTab.tsx'
import { MANUFACTURING, OPERATION } from '@logistics/data/processKinds'
import type { ProcessKind, UUID } from '@logistics/data/types'
import { SmoothTabContainer } from '@microprojects/edm-components/components/master/MasterDetail'
import { Box, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './index' // side-effect: registers the `config/process` namespace
import { ProcessSubProcessesTab } from './ProcessSubProcessesTab.tsx'

type ProcessTabsProps = {
    api: string
    id: UUID
    kind?: ProcessKind
    missedInputs: string[]
    onDetailSelected: Function
}

export function ProcessTabs(props: ProcessTabsProps) {
    const [selected, setSelected] = useState(0)
    const { t } = useTranslation('config/process')
    const showSpecAndGrades =
        props.kind !== OPERATION && props.kind !== MANUFACTURING
    if (props.kind === OPERATION) return null
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={(_, v) => setSelected(v)}>
                    <Tab label={t('tabs.processes')} />
                    {showSpecAndGrades && <Tab label={t('tabs.specification')} />}
                    {showSpecAndGrades && <Tab label={t('tabs.grades')} />}
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                <SmoothTabContainer value={selected}>
                    <ProcessSubProcessesTab {...props} />
                    {showSpecAndGrades && <ProcessSpecificationTab {...props} />}
                    {showSpecAndGrades && <ProcessGradesTab {...props} />}
                </SmoothTabContainer>
            </Box>
        </Box>
    )
}
