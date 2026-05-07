import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor, InfoItem } from '../MasterDetail';
import { DeviceTabs } from './device/DeviceTabs';
import Api from '../api';
import { TextField, FormControl, InputLabel, Select, MenuItem, Box, Autocomplete } from '@mui/material';
import { Memory as MemoryIcon } from '@mui/icons-material';

export function Devices() {
    const history = useHistory();
    const { path } = useRouteMatch();
    const api = Api.devices;
    return (
        <MasterDetail
            api={api}
            stubMessage='Please select a device'
            detail={(
                <DeviceDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => history.push(path)}
                />
            )}
        />
    );
}

DeviceDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    deviceId: PropTypes.number,
    onUpdate: PropTypes.func
}

export function DeviceDetail({ deviceId, parents, ...props }) {
    const type = 'device';
    let { id } = useParams();
    id = deviceId || parseInt(id);
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    const [[models]] = useGet(`${props.api}/models`, []);
    const [[drivers]] = useGet(`${props.api}/drivers`, []);
    
    data = data || {};
    return (
        <Detail {...props}
            id={id}
            type={type}
            icon={<MemoryIcon />}
            parents={parents}
            subDetail={sub}
            loading={loading}
            error={error}
            data={data}
            card={(
                <Info {...props}
                    data={data}
                    content={
                        <>
                            <InfoItem label="Driver" value={data.driverName} />
                            <InfoItem label="Device Type" value={data.profilerName || 'Any'} />
                        </>
                    }
                />
            )}
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
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={models || []}
                                value={values.model || ''}
                                onChange={(event, newValue) => {
                                    handleChange({ target: { name: 'model', value: newValue } });
                                }}
                                renderInput={(params) => <TextField {...params} label="Model" />}
                            />
                            <FormControl fullWidth size="small">
                                <InputLabel>Driver</InputLabel>
                                <Select
                                    name="driverGuid"
                                    value={values.driverGuid || ''}
                                    onChange={handleChange}
                                    label="Driver"
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {drivers?.map((driver) => (
                                        <MenuItem key={driver.guid} value={driver.guid}>
                                            {driver.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                />
            }
            relations={
                <DeviceTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}
