import React from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useGet } from '../hooks/hooks';
import { RelationTable } from '../RelationTable';
import api from '../api';

export const ProfilePlugins = (props) => {
    const [[profiles], loading, error] = useGet(`${api.plugins}/profiles`, []);

    const columns = [
        { field: 'guid', headerName: 'Global Unique Identifier', width: 350 },
        { field: 'name', headerName: 'Profile Type Name', width: 200 },
        { field: 'description', headerName: 'Description', flex: 1 }
    ];

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Profile Plugins
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


