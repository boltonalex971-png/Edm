import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';
import { ComboBox, DropDownList } from '@progress/kendo-react-dropdowns';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';
import { DeviceTabs } from './device/DeviceTabs';
import { DropDownComp } from '../DropDownCell';
import Api from '../api';

export function Devices() {
    const type = 'device';
    const history = useHistory();
    const { path } = useRouteMatch();
    const api = Api.devices;
    return (
        <MasterDetail
            type={type}
            api={api}
            stubMessage='Please select a device'
            detail={(
                <DeviceDetail
                    type={type}
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
    type: PropTypes.string,
    onUpdate: PropTypes.func
}

export function DeviceDetail({ deviceId, ...props }) {
    let { id } = useParams();
    id = deviceId || parseInt(id);
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    const [[models]] = useGet(`${props.api}/models`, []);
    const [[drivers]] = useGet(`${props.api}/drivers`, []);
    const FormComboBox = (formProps) => <ComboBox {...formProps} data={models || ['Loading...']} />;
    const driverComboBox = (compProps) =>
        <DropDownComp {...compProps}
            dataItem={data}
            data={drivers}
            textField='name'
            dataItemKey='guid'
        />;
    data = data || {};
    return (
        <Detail {...props}
            id={id}
            icon={<span className='k-icon k-i-cogs' title='Device' />}
            subDetail={sub}
            loading={loading}
            error={error}
            data={data}
            card={(
                <Info {...props}
                    data={data}
                    content={
                        <div>
                            <p>{data.driverName} ({`${data.profilerName || 'Any'} device type`})</p>
                        </div>
                    }
                />
            )}
            editor={
                <Editor {...props}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={
                        <fieldset className={'k-form-fieldset'}>
                            <legend className={'k-form-legend'}>Edit device data</legend>
                            <div className="mb-3">
                                <Field name={'name'} component={Input} label={'Name'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'description'} component={Input} label={'Description'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'model'} component={FormComboBox} label={'Model'} />
                            </div>
                            <div className="mb-3" style={{ width: '50%' }}>
                                <Field name='driverGuid' component={driverComboBox} label='Driver' />
                            </div>
                        </fieldset>
                    }
                />
            }
            relations={
                <DeviceTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}

