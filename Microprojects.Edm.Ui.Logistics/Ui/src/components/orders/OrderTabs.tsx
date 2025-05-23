import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { ProcessSubProcessesTab } from './ProcessSubProcessesTab.tsx';
import { ProcessQualifiersTab } from './ProcessQualifiersTab';
import {UUID} from "@logistics/data/types";
import {ProcessSpecificationTab} from "@logistics/components/config/process/ProcessSpecificationTab.tsx";
import {OrderSpecificationTab} from "@logistics/components/orders/OrderSpecificationTab.tsx";
import {OrderComponentTab} from "@logistics/components/orders/OrderComponentTab.tsx";
import {OrderOperationTab} from "@logistics/components/orders/OrderOperationTab.tsx";

type OrderTabsProps = {
    api: string,
    id: UUID,
    missedInputs: string[],
    onDetailSelected: Function
}

export function OrderTabs(props : OrderTabsProps) {
    const [selected, setSelected] = useState(0);
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title={'Operations'} >
                <OrderOperationTab {...props} />
            </TabStripTab>
            <TabStripTab title={'Specification'} >
                <OrderSpecificationTab {...props} />
            </TabStripTab>
            <TabStripTab title={'Components'} >
                <OrderComponentTab {...props} />
            </TabStripTab>
        </TabStrip>
    );
}