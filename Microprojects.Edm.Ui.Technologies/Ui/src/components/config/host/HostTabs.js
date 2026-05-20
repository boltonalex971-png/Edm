import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { HostDevicesTab } from './HostDevicesTab';
import { SmoothTabContainer } from '@microprojects/edm-components/components';

HostTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number,
    onDetailSelected: PropTypes.func
}

export function HostTabs(props) {
    const [selected, setSelected] = useState(0);
    const { t } = useTranslation('tech');

    const handleChange = (event, newValue) => {
        setSelected(newValue);
    };

    const tabProps = { ...props, parents: props.parents };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={handleChange} aria-label={t('host.tabs.devices')}>
                    <Tab label={t('host.tabs.devices')} sx={{ textTransform: 'none' }} />
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                <SmoothTabContainer value={selected}>
                    <HostDevicesTab {...tabProps} />
                </SmoothTabContainer>
            </Box>
        </Box>
    );
}
