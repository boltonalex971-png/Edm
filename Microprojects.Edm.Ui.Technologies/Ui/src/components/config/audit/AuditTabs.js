import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box } from '@mui/material';
import { AuditEditorTab } from './AuditEditorTab';
import { AuditQualifiersTab } from './AuditQualifiersTab';
import { SmoothTabContainer } from '@microprojects/edm-components/components';

AuditTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number,
    params: PropTypes.array,
    onDetailSelected: PropTypes.func
}

export function AuditTabs(props) {
    const [selected, setSelected] = useState(0);

    const handleChange = (event, newValue) => {
        setSelected(newValue);
    };

    const tabProps = { ...props, parents: props.parents };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selected} onChange={handleChange} aria-label="audit tabs">
                    <Tab label="Zones" sx={{ textTransform: 'none' }} />
                    <Tab label="Qualifiers" sx={{ textTransform: 'none' }} />
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                <SmoothTabContainer value={selected}>
                    <AuditEditorTab {...tabProps} />
                    <AuditQualifiersTab {...tabProps} />
                </SmoothTabContainer>
            </Box>
        </Box>
    );
}
