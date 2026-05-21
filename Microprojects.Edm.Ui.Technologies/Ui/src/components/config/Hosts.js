import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '@microprojects/edm-components/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBasePath } from '@microprojects/edm-components/hooks';
import { MasterDetail, reloadMaster, Detail, Editor } from '@microprojects/edm-components/components';
import { HostTabs } from './host/HostTabs';
import { Folder } from './Folder';
import Api from '../api';
import { HostConsole } from './host/HostConsole';
import { Dns as DnsIcon, Terminal as ConsoleIcon } from '@mui/icons-material';
import { Box, Button as MuiButton } from '@mui/material';
import { Properties, Property } from '@microprojects/edm-components/components';
import { EditorSection } from '@microprojects/edm-components/components';
import { Field } from '@microprojects/edm-components/components';

export function Hosts() {
    const navigate = useNavigate();
    const path = useBasePath();
    const api = Api.hosts;
    const { t } = useTranslation('tech');
    return (
        <MasterDetail
            api={api}
            hierarchiesApi={Api.hierarchies}
            folderComponent={Folder}
            path={path}
            stubMessage={t('config.stub.host')}
            detail={(
                <HostDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => navigate(path)}
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
    const { t } = useTranslation('tech');
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '', url: '' };
    }

    const statusBadge = (
        <span className={`badge ${data.active ? 'run' : 'idle'}`}>
            <span className="dot" />
            {data.active ? t('common.online') : t('common.offline')}
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
                        <Property label={t('common.address')} value={`${data.url || ''}${data.port ? `:${data.port}` : ''}`} mono placeholder="—" />
                        <Property label={t('common.version')} value={data.version} mono placeholder="—" />
                        <Property label={t('common.mode')} value={data.mode} placeholder="—" />
                        <Property label={t('common.environment')} value={data.environment} placeholder="—" />
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
                            {t('host.openConsole')}
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
                                    title={t('common.identity')}
                                    filled={identityFilled}
                                    total={2}
                                    done={identityFilled === 2 && !nameMissing}
                                >
                                    <Field
                                        full
                                        name="name"
                                        label={t('common.name')}
                                        required
                                        value={values.name}
                                        onChange={handleChange}
                                        state={nameMissing ? 'invalid' : 'pristine'}
                                        help={nameMissing ? t('host.nameMissing') : t('host.nameHelp')}
                                    />
                                    <Field
                                        full
                                        kind="textarea"
                                        name="description"
                                        label={t('common.description')}
                                        rows={2}
                                        value={values.description}
                                        onChange={handleChange}
                                    />
                                </EditorSection>

                                <EditorSection
                                    number={2}
                                    title={t('host.endpoint')}
                                    filled={endpointFilled}
                                    total={2}
                                    done={endpointFilled === 2 && !urlMissing}
                                >
                                    <Field
                                        name="url"
                                        label={t('common.address')}
                                        required
                                        value={values.url}
                                        onChange={handleChange}
                                        placeholder={t('host.addressPlaceholder')}
                                        state={urlMissing ? 'invalid' : 'pristine'}
                                        help={urlMissing ? t('host.addressRequired') : t('host.addressHelp')}
                                    />
                                    <Field
                                        name="port"
                                        label={t('host.port')}
                                        type="number"
                                        value={values.port}
                                        onChange={handleChange}
                                        placeholder={t('host.portPlaceholder')}
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
