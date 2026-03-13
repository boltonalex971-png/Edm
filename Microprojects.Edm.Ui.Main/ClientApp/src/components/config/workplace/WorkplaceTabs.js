import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box } from '@mui/material';
import { WorkplaceDevicesTab } from './WorkplaceDevicesTab';
import { WorkplaceProcessesTab } from './WorkplaceProcessesTab';
import { SmoothTabContainer } from '../../MasterDetail';

WorkplaceTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number,
    onDetailSelected: PropTypes.func
}

export function WorkplaceTabs(props) {
    const [selected, setSelected] = useState(0);

    const handleChange = (event, newValue) => {
        setSelected(newValue);
    };

    const tabProps = { ...props, parents: props.parents };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={handleChange} aria-label="workplace tabs">
                    <Tab label="Devices" sx={{ textTransform: 'none' }} />
                    <Tab label="Processes" sx={{ textTransform: 'none' }} />
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                <SmoothTabContainer value={selected}>
                    <WorkplaceDevicesTab {...tabProps} />
                    <WorkplaceProcessesTab {...tabProps} />
                </SmoothTabContainer>
            </Box>
        </Box>
    );
}
