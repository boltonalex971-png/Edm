import React from 'react';
import { Alert, Box, CircularProgress, Typography, Link } from '@mui/material';
import { useGet } from '@microprojects/edm-components/hooks';
import { RelationTable } from '@microprojects/edm-components/components';
import { useTranslation } from 'react-i18next';
import api from '../api';

export const OperationPlugins = (props) => {
    const [[ops], loading, error] = useGet(`${api.plugins}/operations`, []);
    const { t } = useTranslation('tech');

    const columns = [
        { field: 'guid', headerName: t('plugins.guid'), width: 350 },
        {
            field: 'name',
            headerName: t('plugins.operationName'),
            width: 250,
            renderCell: (params) => (
                <Link
                    component="button"
                    variant="body2"
                    onClick={(e) => {
                        window.open(`/${params.row.homepage}`, '_blank');
                        e.target.blur();
                    }}
                    sx={{ textDecoration: 'none', fontWeight: 500, textAlign: 'left' }}
                >
                    {params.value}
                </Link>
            )
        },
        { field: 'description', headerName: t('common.description'), flex: 1 }
    ];

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('plugins.operationPlugins')}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {loading && !ops && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={32} />
                </Box>
            )}
            {ops && (
                <RelationTable 
                    data={ops} 
                    columns={columns} 
                    editable={false} 
                    removable={false} 
                />
            )}
        </Box>
    );
};


