import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '@microprojects/edm-components/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBasePath } from '@microprojects/edm-components/hooks';
import { MasterDetail, reloadMaster, Detail, Editor } from '@microprojects/edm-components/components';
import { DeviceTabs } from './device/DeviceTabs';
import Api from '../api';
import { Box } from '@mui/material';
import { Memory as MemoryIcon } from '@mui/icons-material';
import { Properties, Property } from '@microprojects/edm-components/components';
import { EditorSection } from '@microprojects/edm-components/components';
import { Field } from '@microprojects/edm-components/components';

export function Devices() {
    const navigate = useNavigate();
    const path = useBasePath();
    const api = Api.devices;
    const { t } = useTranslation('tech');
    return (
        <MasterDetail
            api={api}
            hierarchiesApi={Api.directories}

            path={path}
            stubMessage={t('config.stub.device')}
            detail={(
                <DeviceDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => navigate(path)}
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
    id = deviceId || id;
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    const [[models]] = useGet(`${props.api}/models`, []);
    const [[drivers]] = useGet(`${props.api}/drivers`, []);
    const { t } = useTranslation('tech');

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
            card={
                <Properties>
                    <Property label={t('common.driver')} value={data.driverName} muted={!data.driverName} placeholder={t('device.noDriver')} />
                    <Property label={t('device.deviceType')} value={data.profilerName} muted={!data.profilerName} placeholder={t('device.any')} />
                    <Property label={t('common.model')} value={data.model} mono placeholder="—" />
                </Properties>
            }
            editor={
                <Editor {...props}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => {
                        const identityFilled = [values.name, values.description]
                            .filter(v => v && String(v).trim().length > 0).length;
                        const hardwareFilled = [values.model, values.driverGuid]
                            .filter(v => v && String(v).trim().length > 0).length;
                        const nameMissing = !!values.id && (!values.name || !values.name.trim());
                        const driverMissing = !!values.id && !values.driverGuid;

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
                                        help={nameMissing ? t('device.nameMissing') : t('device.nameHelp')}
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
                                    title={t('device.hardware')}
                                    filled={hardwareFilled}
                                    total={2}
                                    done={hardwareFilled === 2 && !driverMissing}
                                >
                                    <Field
                                        kind="select"
                                        name="model"
                                        label={t('common.model')}
                                        value={values.model}
                                        onChange={handleChange}
                                        placeholder={t('device.selectModel')}
                                        options={(models || []).map(m => ({ value: m, label: m }))}
                                    />
                                    <Field
                                        kind="select"
                                        name="driverGuid"
                                        label={t('common.driver')}
                                        required
                                        value={values.driverGuid}
                                        onChange={handleChange}
                                        placeholder={t('device.selectDriver')}
                                        options={(drivers || []).map(d => ({ value: d.guid, label: d.name }))}
                                        state={driverMissing ? 'invalid' : 'pristine'}
                                        help={driverMissing ? t('device.driverRequired') : undefined}
                                    />
                                </EditorSection>
                            </Box>
                        );
                    }}
                />
            }
            relations={
                <DeviceTabs id={id} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}
