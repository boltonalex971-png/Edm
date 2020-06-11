import React from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';
import { HostTabs } from './host/HostTabs';

export function Hosts() {
    let { path } = useRouteMatch();
    const api = '/api/hosts';
    return (
        <MasterDetail
            api={api}
            stubMessage='Please select a host'
            detail={(
                <HostDetail api={api} path={path} onChange={() => reloadMaster()} />
            )}
        />
    );
}

HostDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string
}

function HostDetail(props) {
    let { id } = useParams();
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    if (!data || data.id == 0) {
        data = { ...data, name: '', description: '', url: '' };
    }
    return (
        <Detail {...props}
            id={id}
            loading={loading}
            error={error}
            data={data}
            card={
                <Info {...props}
                    data={data}
                    content={
                        <div>
                            <p>{`${data.url}:${data.port}`}</p>
                        </div>
                    }
                />
            }
            editor={
                <Editor {...props}
                    data={data}
                    setData={setData}
                    content={
                        <fieldset className={'k-form-fieldset'}>
                            <legend className={'k-form-legend'}>Edit host data</legend>
                            <div className="mb-3">
                                <Field name={'name'} component={Input} label={'Name'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'description'} component={Input} label={'Description'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'port'} component={NumericTextBox} label={'Port'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'url'} component={Input} label={'Address'} />
                            </div>
                        </fieldset>
                    }
                />
            }
            relations={
                <HostTabs id={parseInt(id)} api={props.api} />
            } />
    );
}

