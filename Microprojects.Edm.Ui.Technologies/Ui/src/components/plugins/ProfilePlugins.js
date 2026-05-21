import React from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useGet } from '@microprojects/edm-components/hooks';
import { RelationTable } from '@microprojects/edm-components/components';
import { useTranslation } from 'react-i18next';
import api from '../api';

export const ProfilePlugins = (props) => {
    const [[profiles], loading, error] = useGet(`${api.plugins}/profiles`, []);
    const { t } = useTranslation('tech');

    const columns = [
        { field: 'guid', headerName: t('plugins.guid'), width: 350 },
        { field: 'name', headerName: t('plugins.profileTypeName'), width: 200 },
        { field: 'description', headerName: t('common.description'), flex: 1 }
    ];

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('plugins.profilePlugins')}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {loading && !profiles && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={32} />
                </Box>
            )}
            {profiles && (
                <RelationTable 
                    data={profiles} 
                    columns={columns} 
                    editable={false} 
                    removable={false} 
                />
            )}
        </Box>
    );
};


