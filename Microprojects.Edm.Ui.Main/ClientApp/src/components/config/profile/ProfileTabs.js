import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box } from '@mui/material';
import { ProfileEditorTab } from './ProfileEditorTab';
import { ProfileAuditsTab } from './ProfileAuditsTab';
import { SmoothTabContainer } from '../../MasterDetail';

ProfileTabs.propTypes = {
    api: PropTypes.string,
    profiler: PropTypes.string,
    id: PropTypes.number,
    onDetailSelected: PropTypes.func
}

export function ProfileTabs(props) {
    const [selected, setSelected] = useState(0);

    const handleChange = (event, newValue) => {
        setSelected(newValue);
    };

    const tabProps = { ...props, parents: props.parents };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={handleChange} aria-label="profile tabs">
                    <Tab label="Profile" sx={{ textTransform: 'none' }} />
                    <Tab label="Audits" sx={{ textTransform: 'none' }} />
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                <SmoothTabContainer value={selected}>
                    <ProfileEditorTab {...tabProps} />
                    <ProfileAuditsTab {...tabProps} />
                </SmoothTabContainer>
            </Box>
        </Box>
    );
}
