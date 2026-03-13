import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Api from '../api';
import { useGet } from '../hooks/hooks';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor, InfoItem } from '../MasterDetail';
import { ProcessTabs } from './process/ProcessTabs';
import { TextField, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import {
    AccountTree as AccountTreeIcon,
} from '@mui/icons-material';

export function Processes() {
    let { path } = useRouteMatch();
    const history = useHistory();
    const api = Api.processes;
    return (
        <MasterDetail
            api={api}
            path={path}
            stubMessage='Please select a process'
            detail={
                <ProcessDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => history.push(path)}
                />
            }
        />
    );
}

ProcessDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    processId: PropTypes.number,
    onUpdate: PropTypes.func
}

export function ProcessDetail({ processId, parents, ...props }) {
    const type = 'process';
    let { id } = useParams();
    id = processId || parseInt(id);
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    const [[ops]] = useGet(`${Api.plugins}/operations`, []);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '' };
    }

    const missedInputs = JSON.parse(data.message || '[]');
    return (
        <Detail {...props}
            id={id}
            type={type}
            icon={<AccountTreeIcon />}
            loading={loading}
            error={error}
            validation={
                missedInputs.length > 0 ?
                    `Parameter${missedInputs.length > 1 ? 's' : ''} ${missedInputs.join(', ')} ${missedInputs.length > 1 ? 'are' : 'is'} not available as output parameters` : ''
            }
            data={data}
            parents={parents}
            subDetail={sub}
            card={
                <Info {...props}
                    data={data}
                    content={
                        <>
                            <InfoItem label="Name" value={data.name} />
                            <InfoItem label="Description" value={data.description} />
                            {data.commonUid && <InfoItem label="Common UID" value={data.commonUid} />}
                        </>
                    }
                />
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
                            <FormControl fullWidth size="small">
                                <InputLabel>Operation</InputLabel>
                                <Select
                                    name="operationGuid"
                                    value={values.operationGuid || ''}
                                    onChange={handleChange}
                                    label="Operation"
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {ops?.map((op) => (
                                        <MenuItem key={op.guid} value={op.guid}>
                                            {op.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                />
            }
            relations={
                <ProcessTabs id={parseInt(id)} api={props.api} missedInputs={missedInputs} onDetailSelected={setSub} />
            }
        />
    );
}
