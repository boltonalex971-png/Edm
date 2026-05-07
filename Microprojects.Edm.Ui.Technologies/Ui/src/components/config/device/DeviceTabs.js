import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box } from '@mui/material';
import { DeviceHostsTab } from './DeviceHostsTab';
import { SmoothTabContainer } from '../../MasterDetail';

DeviceTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number,
    onDetailSelected: PropTypes.func
}

export function DeviceTabs(props) {
    const [selected, setSelected] = useState(0);

    const handleChange = (event, newValue) => {
        setSelected(newValue);
    };

    const tabProps = { ...props, parents: props.parents };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={handleChange} aria-label="device tabs">
                    <Tab label="Hosts" sx={{ textTransform: 'none' }} />
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                <SmoothTabContainer value={selected}>
                    <DeviceHostsTab {...tabProps} />
                </SmoothTabContainer>
            </Box>
        </Box>
    );
}
