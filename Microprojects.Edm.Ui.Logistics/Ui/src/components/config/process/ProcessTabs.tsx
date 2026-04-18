import { ProcessGradesTab } from '@logistics/components/config/process/ProcessGradesTab.tsx'
import { ProcessSpecificationTab } from '@logistics/components/config/process/ProcessSpecificationTab.tsx'
import { MANUFACTURING, OPERATION } from '@logistics/data/processKinds'
import type { ProcessKind, UUID } from '@logistics/data/types'
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout'
import PropTypes from 'prop-types'
import React, { useState } from 'react'
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
    const showSpecAndGrades =
        props.kind !== OPERATION && props.kind !== MANUFACTURING
    if (props.kind === OPERATION) return
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title={'Processes'}>
                <ProcessSubProcessesTab {...props} />
            </TabStripTab>
            {showSpecAndGrades && (
                <TabStripTab title={'Specification'}>
                    <ProcessSpecificationTab {...props} />
                </TabStripTab>
            )}
            {showSpecAndGrades && (
                <TabStripTab title={'Grades'}>
                    <ProcessGradesTab {...props} />
                </TabStripTab>
            )}
        </TabStrip>
    )
}
