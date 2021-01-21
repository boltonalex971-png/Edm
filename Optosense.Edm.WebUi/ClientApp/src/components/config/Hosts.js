import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';
import { HostTabs } from './host/HostTabs';

export function Hosts() {
    const history = useHistory();
    const { path } = useRouteMatch();
    const api = '/api/hosts';
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
    hostId: PropTypes.number
}

export function HostDetail({ hostId, ...props }) {
    let { id } = useParams();
    id = hostId || id;
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '', url: '' };
    }
    return (
        <Detail {...props}
            id={id}
            loading={loading}
            error={error}
            data={data}
            subDetail={sub}
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
                <HostTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub}/>
            } />
    );
}

