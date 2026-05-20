import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ProcessProfilesTab } from './ProcessProfilesTab';
import { ProcessQualifiersTab } from './ProcessQualifiersTab';
import { SmoothTabContainer } from '@microprojects/edm-components/components';

ProcessTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number,
    missedInputs: PropTypes.arrayOf(PropTypes.string),
    onDetailSelected: PropTypes.func
}

export function ProcessTabs(props) {
    const [selected, setSelected] = useState(0);
    const { t } = useTranslation('tech');

    const handleChange = (event, newValue) => {
        setSelected(newValue);
    };

    const tabProps = { ...props, parents: props.parents };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={handleChange} aria-label={t('process.tabs.profiles')}>
                    <Tab label={t('process.tabs.profiles')} sx={{ textTransform: 'none' }} />
                    <Tab label={t('process.tabs.qualifiers')} sx={{ textTransform: 'none' }} />
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                <SmoothTabContainer value={selected}>
                    <ProcessProfilesTab {...tabProps} />
                    <ProcessQualifiersTab {...tabProps} />
                </SmoothTabContainer>
            </Box>
        </Box>
    );
}
