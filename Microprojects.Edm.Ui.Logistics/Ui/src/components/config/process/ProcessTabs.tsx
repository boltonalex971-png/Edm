import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {TabStrip, TabStripTab} from '@progress/kendo-react-layout';
import {ProcessSubProcessesTab} from './ProcessSubProcessesTab.tsx';
import {ProcessKind, UUID} from "@logistics/data/types";
import {ProcessSpecificationTab} from "@logistics/components/config/process/ProcessSpecificationTab.tsx";
import {OPERATION} from "@logistics/data/processKinds";

type ProcessTabsProps = {
    api: string,
    id: UUID,
    kind?: ProcessKind,
    missedInputs: string[],
    onDetailSelected: Function
}

export function ProcessTabs(props: ProcessTabsProps) {
    const [selected, setSelected] = useState(0);
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            {props.kind !== OPERATION &&
                <TabStripTab title={'Processes'}>
                    <ProcessSubProcessesTab {...props} />
                </TabStripTab>
            }
            <TabStripTab title={'Specification'}>
                <ProcessSpecificationTab {...props} />
            </TabStripTab>
        </TabStrip>
    );
}