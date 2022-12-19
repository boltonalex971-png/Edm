import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { TasksTab } from './TasksTab';
import { LogTab } from './LogTab';
import { DriversTab } from './DriversTab';

HostTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number,
    onDetailSelected: PropTypes.func
}

export function HostTabs(props) {
    const [href] = useState(process.env.REACT_APP_API_URL || window.location.origin);
    const [selected, setSelected] = useState(0);
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title={'Jobs'} >
                <TasksTab href={href} />
            </TabStripTab>
            <TabStripTab title={'Drivers'} >
                <DriversTab href={href} />
            </TabStripTab>
            <TabStripTab title={'Log'} >
                <LogTab href={href} />
            </TabStripTab>
        </TabStrip>
    );
}