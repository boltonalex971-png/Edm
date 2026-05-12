import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '@microprojects/edm-components/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { useBasePath } from '@microprojects/edm-components/hooks';
import { MasterDetail, reloadMaster, Detail, Editor } from '@microprojects/edm-components/components';
import { DeviceTabs } from './device/DeviceTabs';
import { Folder } from './Folder';
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
    return (
        <MasterDetail
            api={api}
            hierarchiesApi={Api.hierarchies}
            folderComponent={Folder}
            path={path}
            stubMessage='Please select a device'
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
            card={
                <Properties>
                    <Property label="Driver" value={data.driverName} muted={!data.driverName} placeholder="No driver" />
                    <Property label="Device type" value={data.profilerName} muted={!data.profilerName} placeholder="Any" />
                    <Property label="Model" value={data.model} mono placeholder="—" />
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
                                        help={nameMissing ? 'A device must have a name.' : 'Shown in the master tree and in workplace device-config rows.'}
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
                                    title="Hardware"
                                    filled={hardwareFilled}
                                    total={2}
                                    done={hardwareFilled === 2 && !driverMissing}
                                >
                                    <Field
                                        kind="select"
                                        name="model"
                                        label="Model"
                                        value={values.model}
                                        onChange={handleChange}
                                        placeholder="Select model"
                                        options={(models || []).map(m => ({ value: m, label: m }))}
                                    />
                                    <Field
                                        kind="select"
                                        name="driverGuid"
                                        label="Driver"
                                        required
                                        value={values.driverGuid}
                                        onChange={handleChange}
                                        placeholder="Select driver"
                                        options={(drivers || []).map(d => ({ value: d.guid, label: d.name }))}
                                        state={driverMissing ? 'invalid' : 'pristine'}
                                        help={driverMissing ? 'Pick the driver that talks to this device.' : undefined}
                                    />
                                </EditorSection>
                            </Box>
                        );
                    }}
                />
            }
            relations={
                <DeviceTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}
