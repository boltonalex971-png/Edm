import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor, InfoItem } from '../MasterDetail';
import { WorkbenchDevicesTab } from './workplace/WorkbenchDevicesTab';
import { Box, Button as MuiButton, Typography, Grid, TextField } from '@mui/material';
import { PlayArrow as PlayIcon, Handyman as WorkbenchIcon } from '@mui/icons-material';
import axios from 'axios';
import api from '../api';
import { useDispatch } from 'react-redux';
import { setProcess, setWorkbench } from '../../slices/newOperationSlice.ts';


WorkbenchDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    workbenchId: PropTypes.number,
    onUpdate: PropTypes.func
}

export function WorkbenchDetail({ workbenchId, parents, ...props }) {
    const type = 'workbench';
    const history = useHistory()
    const dispatch = useDispatch()
    let { id } = useParams();
    id = workbenchId || id;
    let [sub, setSub] = useState();
    const [proc, setProc] = useState()
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id], data => {
        axios.get(`${api.workplaces}/processes/${data.workplaceProcessId}`)
            .then(response => setProc(response.data))
    });
    const onOperationStart = () => {
        dispatch(setWorkbench(data))
        dispatch(setProcess(proc))
        history.push('/operation')
    };
    useEffect(setSub, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '', url: '' };
    }

    return (
        <Detail {...props}
            id={id}
            type={type}
            icon={<WorkbenchIcon />}
            loading={loading}
            error={error}
            data={data}
            parents={parents}
            subDetail={sub}
            copyable={false}
            deletable={false}
            card={
                <Info {...props}
                    data={data}
                    title="Workbench Details"
                    content={
                        <>
                            <InfoItem label="Name" value={data.name} />
                            <InfoItem label="Description" value={data.description} />
                            {data.commonUid && <InfoItem label="Common UID" value={data.commonUid} />}
                        </>
                    }
                />
            }
            relations={
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>
                            Device Configurations
                        </Typography>
                        <MuiButton 
                            variant="contained" 
                            color="primary" 
                            startIcon={<PlayIcon />} 
                            onClick={onOperationStart}
                            size="small"
                            sx={{ textTransform: 'none', borderRadius: '4px' }}
                        >
                            Start Operation
                        </MuiButton>
                    </Box>
                    <WorkbenchDevicesTab id={parseInt(id)} processId={data.processId} api={props.api} onDetailSelected={setSub} />
                </Box>
            }
            editor={

                <Editor {...props}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <TextField
                                fullWidth
                                label="Name"
                                name="name"
                                value={values.name || ''}
                                onChange={handleChange}
                                size="small"
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={values.description || ''}
                                onChange={handleChange}
                                size="small"
                                multiline
                                rows={2}
                            />
                            <TextField
                                fullWidth
                                label="Common UID"
                                name="commonUid"
                                value={values.commonUid || ''}
                                onChange={handleChange}
                                size="small"
                            />
                        </Box>
                    )}
                />
            }
        />
    );
}


