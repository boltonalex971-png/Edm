import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { DropDownCell, LinkTextCell } from '@microprojects/edm-components/components';
import { useGet } from '@microprojects/edm-components/hooks';
import { ProfileDetail } from '../Profiles';
import { Chip, Stack, Box, Tooltip } from '@mui/material';
import { Warning as WarningIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

ProcessProfilesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    missedInputs: PropTypes.arrayOf(PropTypes.string),
    onDetailSelected: PropTypes.func
}

export function ProcessProfilesTab({ id, api, missedInputs, onDetailSelected, parents }) {
    const [[data]] = useGet(`${Api.devices}/profilers`);

    const columns = [
        {
            field: 'profilerGuid',
            headerName: 'Profiler',
            width: 200,
            renderCell: (params) => (
                <DropDownCell 
                    {...params} 
                    getData={() => data || []} 
                    dataKey='guid' 
                    text='name' 
                    fieldId='guid' 
                />
            )
        },
        {
            field: 'name',
            headerName: 'Name',
            width: 200,
            renderCell: (params) => (
                <LinkTextCell 
                    {...params}
                    fieldId='id'
                    onClick={(profileId, itemUpdate) => onDetailSelected(
                        <ProfileDetail
                            type='profile'
                            profileId={profileId}
                            api={Api.profiles}
                            onClose={() => onDetailSelected()}
                            onUpdate={itemUpdate}
                            parents={parents}
                        />
                    )}
                />
            )
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1
        },
        {
            field: 'input',
            headerName: 'Input params',
            width: 250,
            renderCell: (params) => {
                const items = JSON.parse(params.value || '[]');
                return (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ py: 0.5 }}>
                        {items.map((el) => {
                            const missed = (missedInputs || []).find(item => item === el);
                            return (
                                <Tooltip key={el} title={missed ? 'Missing parameter' : ''}>
                                    <Chip 
                                        label={el} 
                                        size="small" 
                                        variant="outlined"
                                        color={missed ? 'error' : 'default'}
                                        icon={missed ? <WarningIcon sx={{ fontSize: '14px !important' }} /> : <CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                        sx={{ borderRadius: '4px', height: '20px', '& .MuiChip-label': { px: 1, fontSize: '11px' } }}
                                    />
                                </Tooltip>
                            );
                        })}
                    </Stack>
                );
            }
        },
        {
            field: 'output',
            headerName: 'Output params',
            width: 250,
            renderCell: (params) => {
                const items = JSON.parse(params.value || '[]');
                return (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ py: 0.5 }}>
                        {items.map((el) => (
                            <Chip 
                                key={el} 
                                label={el} 
                                size="small" 
                                variant="outlined"
                                sx={{ borderRadius: '4px', height: '20px', '& .MuiChip-label': { px: 1, fontSize: '11px' } }}
                            />
                        ))}
                    </Stack>
                );
            }
        }
    ];

    return (
        <RelationTable 
            api={`${api}/${id}/profiles`} 
            removable 
            columns={columns}
        />
    );
}


