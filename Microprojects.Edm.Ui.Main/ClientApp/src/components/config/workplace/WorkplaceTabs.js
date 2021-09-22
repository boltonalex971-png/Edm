import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { WorkplaceDevicesTab } from './WorkplaceDevicesTab';
import { WorkplaceProcessesTab } from './WorkplaceProcessesTab';

WorkplaceTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number,
    onDetailSelected: PropTypes.func
}

export function WorkplaceTabs(props) {
    const [selected, setSelected] = useState(0);
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title={'Devices'} >
                <WorkplaceDevicesTab {...props} />
            </TabStripTab>
            <TabStripTab title={'Processes'}>
                <WorkplaceProcessesTab {...props} />
            </TabStripTab>
        </TabStrip>
    );
}