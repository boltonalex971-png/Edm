import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { useGet } from '@microprojects/edm-components/hooks';
import { ProcessDetail } from '../Processes';
import { useHistory } from 'react-router-dom';
import { ProcessWorkbenchesDetail } from './ProcessWorkbenches';
import { Link, Select, MenuItem, FormControl } from '@mui/material';

WorkplaceProcessesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function WorkplaceProcessesTab({ id, api, onDetailSelected, parents }) {
    const history = useHistory();
    const [[data]] = useGet(`${api}/processes`);

    const workbenchesClick = (wsPrId) => {
        onDetailSelected(
            <ProcessWorkbenchesDetail
                workplaceProcessId={wsPrId}
                api={`${api}/processes`}
                onClose={() => onDetailSelected()}
                parents={parents}
            />
        );
    };

    const columns = [
        {
            field: 'processId',
            headerName: 'Process',
            width: 250,
            editable: true,
            renderCell: (params) => {
                const processName = params.row.processName || 'Select Process';
                return (
                    <Link
                        component="button"
                        variant="body2"
                        onClick={(e) => {
                            e.stopPropagation();
                            const path = '/config/processes';
                            onDetailSelected(
                                <ProcessDetail
                                    processId={params.row.processId}
                                    api={Api.processes}
                                    path={path}
                                    onClose={() => onDetailSelected()}
                                    onUp={() => history.push(`${path}/${params.row.processId}`)}
                                    parents={parents}
                                />
                            );
                        }}
                        sx={{ textDecoration: 'none', fontWeight: 500 }}
                    >
                        {processName}
                    </Link>
                );
            },
            renderEditCell: (params) => (
                <FormControl fullWidth size="small">
                    <Select
                        value={params.value || ''}
                        onChange={(e) => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value })}
                        size="small"
                        fullWidth
                    >

                        {data?.map((p) => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )
        },
        {
            field: 'id',
            headerName: 'Workbenches',
            width: 150,
            renderCell: (params) => {
                return (
                    <Link
                        component="button"
                        variant="body2"
                        onClick={(e) => {
                            e.stopPropagation();
                            workbenchesClick(params.row.id);
                        }}
                        sx={{ textDecoration: 'none' }}
                    >
                        Configure...
                    </Link>
                );
            }
        },
        {
            field: 'processDescription',
            headerName: 'Description',
            flex: 1,
            editable: false
        }
    ];

    return (
        <RelationTable 
            api={`${api}/${id}/processes`} 
            removable 
            editable
            columns={columns}
        />
    );
}
