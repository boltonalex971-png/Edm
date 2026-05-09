import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Editor } from '../MasterDetail';
import { HostTabs } from './host/HostTabs';
import Api from '../api';
import { HostConsole } from './host/HostConsole';
import { Dns as DnsIcon, Terminal as ConsoleIcon } from '@mui/icons-material';
import { Box, Button as MuiButton } from '@mui/material';
import { Properties, Property } from '../forms/Properties';
import { EditorSection } from '../forms/EditorSection';
import { Field } from '../forms/Field';

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

    const statusBadge = (
        <span className={`badge ${data.active ? 'run' : 'idle'}`}>
            <span className="dot" />
            {data.active ? 'Online' : 'Offline'}
        </span>
    );

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
            status={statusBadge}
            card={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <Properties>
                        <Property label="Address" value={`${data.url || ''}${data.port ? `:${data.port}` : ''}`} mono placeholder="—" />
                        <Property label="Version" value={data.version} mono placeholder="—" />
                        <Property label="Mode" value={data.mode} placeholder="—" />
                        <Property label="Environment" value={data.environment} placeholder="—" />
                    </Properties>
                    <Box>
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
                        >
                            Open Host Console
                        </MuiButton>
                    </Box>
                </Box>
            }
            editor={
                <Editor {...props}
                    type='host'
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => {
                        const identityFilled = [values.name, values.description]
                            .filter(v => v && String(v).trim().length > 0).length;
                        const endpointFilled = [values.url, values.port]
                            .filter(v => v !== undefined && v !== null && String(v).trim().length > 0).length;
                        const nameMissing = !!values.id && (!values.name || !values.name.trim());
                        const urlMissing = !!values.id && (!values.url || !String(values.url).trim());

                        return (
                            <Box>
                                <EditorSection
                                    number={1}
                                    title="Identity"
                                    filled={identityFilled}
                                    total={2}
                                    done={identityFilled === 2 && !nameMissing}
                                >
                                    <Field
                                        full
                                        name="name"
                                        label="Name"
                                        required
                                        value={values.name}
                                        onChange={handleChange}
                                        state={nameMissing ? 'invalid' : 'pristine'}
                                        help={nameMissing ? 'A host must have a name.' : 'Shown across the tree, breadcrumbs, and dispatch board.'}
                                    />
                                    <Field
                                        full
                                        kind="textarea"
                                        name="description"
                                        label="Description"
                                        rows={2}
                                        value={values.description}
                                        onChange={handleChange}
                                    />
                                </EditorSection>

                                <EditorSection
                                    number={2}
                                    title="Endpoint"
                                    filled={endpointFilled}
                                    total={2}
                                    done={endpointFilled === 2 && !urlMissing}
                                >
                                    <Field
                                        name="url"
                                        label="Address"
                                        required
                                        value={values.url}
                                        onChange={handleChange}
                                        placeholder="hostname or IP"
                                        state={urlMissing ? 'invalid' : 'pristine'}
                                        help={urlMissing ? 'Required to reach the host.' : 'gRPC endpoint, no protocol prefix.'}
                                    />
                                    <Field
                                        name="port"
                                        label="Port"
                                        type="number"
                                        value={values.port}
                                        onChange={handleChange}
                                        placeholder="e.g. 16332"
                                    />
                                </EditorSection>
                            </Box>
                        );
                    }}
                />
            }
            relations={
                <HostTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}
