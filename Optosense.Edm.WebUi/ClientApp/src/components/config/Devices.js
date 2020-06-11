import React from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';
import { ComboBox } from '@progress/kendo-react-dropdowns';
import { useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';

export function Devices() {
    let { path } = useRouteMatch();
    const api = '/api/devices';
    return (
        <MasterDetail
            api={api}
            stubMessage='Please select a device'
            detail={(
                <DeviceDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()} />
            )}
        />
    );
}

DeviceDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string
}

function DeviceDetail(props) {
    const FormComboBox = (formProps) => {
        return (
            <ComboBox {...formProps}
                // label={formProps.label}
                // name={formProps.name}
                // value={formProps.value}
                // onChange={formProps.onChange}
                data={models || ['Loading...']}
            />
        );
    };
    let { id } = useParams();
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    const [[models]] = useGet(`${props.api}/models`, []);
    data = data || {};
    return (
        <Detail {...props}
            id={id}
            loading={loading}
            error={error}
            data={data}
            card={(
                <Info {...props}
                    data={data}
                    content={
                        <div>
                            <p>{data.model} ({`${data.envType} device`})</p>
                        </div>
                    }
                />
            )}
            editor={
                <Editor {...props}
                    data={data}
                    setData={setData}
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
                            <div className="mb-3">
                                <Field name={'parameters'} component={Input} label={'Parameters'} />
                            </div>
                        </fieldset>
                    }
                />
            }
        />
    );
}

