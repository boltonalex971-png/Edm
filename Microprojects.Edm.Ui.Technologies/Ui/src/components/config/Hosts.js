import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor, InfoItem } from '../MasterDetail';
import { HostTabs } from './host/HostTabs';
import Api from '../api';
import { HostConsole } from './host/HostConsole';
import { Dns as DnsIcon, Terminal as ConsoleIcon } from '@mui/icons-material';
import { 
    Box, 
    Button as MuiButton,
    Chip,
    Grid,
    TextField
} from '@mui/material';

export function Hosts() {
    const history = useHistory();
    const { path } = useRouteMatch();
    const api = Api.hosts;
    return (
        <MasterDetail
            api={api}
            stubMessage='Please select a host'
            detail={(
                <HostDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => history.push(path)}
                />
            )}
        />
    );
}

HostDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    hostId: PropTypes.number,
    onUpdate: PropTypes.func
}

export function HostDetail({ hostId, parents, ...props }) {
    const type = 'host';
    let { id } = useParams();
    id = hostId || parseInt(id);
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '', url: '' };
    }
    return (
        <Detail {...props}
            id={id}
            type={type}
            icon={<DnsIcon />}

            loading={loading}
            error={error}
            data={data}
            parents={parents}
            subDetail={sub}
            card={
                <Info {...props}
                    data={data}
                    content={
                        <>
                            <InfoItem label="Address" value={`${data.url}:${data.port}`} />
                            <InfoItem label="Status">
                                <Chip 
                                    label={data.active ? 'Online' : 'Offline'} 
                                    color={data.active ? 'success' : 'error'} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ borderRadius: '4px' }}
                                />
                            </InfoItem>
                            {data.version && <InfoItem label="Version" value={data.version} />}
                            {data.mode && <InfoItem label="Mode" value={data.mode} />}
                            {data.environment && <InfoItem label="Environment" value={data.environment} />}
                            
                            <Grid item xs={12}>
                                <MuiButton 
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ConsoleIcon />}
                                    disabled={data.active === false}
                                    onClick={() => setSub(
                                        <HostConsole
                                            data={data}
                                            onClose={() => setSub()}
                                        />)
                                    }
                                    sx={{ mt: 1, textTransform: 'none', borderRadius: '4px' }}
                                >
                                    Open Host Console
                                </MuiButton>
                            </Grid>
                        </>
                    }
                />
            }
            editor={
                <Editor {...props}
                    type='host'
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
                                label="Port"
                                name="port"
                                type="number"
                                value={values.port || ''}
                                onChange={handleChange}
                                size="small"
                            />
                            <TextField
                                fullWidth
                                label="Address"
                                name="url"
                                value={values.url || ''}
                                onChange={handleChange}
                                size="small"
                            />
                        </Box>
                    )}
                />
            }
            relations={
                <HostTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}
