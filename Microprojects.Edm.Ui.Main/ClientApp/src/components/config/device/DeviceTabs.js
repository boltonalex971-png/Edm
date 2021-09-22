import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { DeviceHostsTab } from './DeviceHostsTab';

DeviceTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number,
    onDetailSelected: PropTypes.func
}

export function DeviceTabs(props) {
    const [selected, setSelected] = useState(0);
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title={'Hosts'} >
                <DeviceHostsTab {...props} />
            </TabStripTab>
        </TabStrip>
    );
}