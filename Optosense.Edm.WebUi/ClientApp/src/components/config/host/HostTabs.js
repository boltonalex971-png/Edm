import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { HostDevicesTab } from './HostDevicesTab';

HostTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number
}

export function HostTabs(props) {
    const [selected, setSelected] = useState(0);
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title={'Devices'} >
                <HostDevicesTab {...props} />
            </TabStripTab>
        </TabStrip>
    );
}