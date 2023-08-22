import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Api from '../api';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';
import { Label } from 'reactstrap';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';
import { ProcessTabs } from './process/ProcessTabs';
import { DropDownComp } from '../DropDownCell';

export function Processes() {
    const type = 'process';
    let { path } = useRouteMatch();
    const history = useHistory();
    const api = Api.processes;
    return (
        <MasterDetail
            type={type}
            api={api}
            path={path}
            stubMessage='Please select a process'
            detail={
                <ProcessDetail
                    type={type}
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
    type: PropTypes.string,
    onUpdate: PropTypes.func
}

export function ProcessDetail({ processId, ...props }) {
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
            icon={<span className='k-icon k-i-aggregate-fields' title='Process' />}
            loading={loading}
            error={error}
            validation={
                missedInputs.length > 0 ?
                    `Parameter${missedInputs.length > 1 ? 's' : ''} ${missedInputs.join(', ')} ${missedInputs.length > 1 ? 'are' : 'is'} not available as output parameters` : ''
            }
            data={data}
            subDetail={sub}
            card={
                <Info {...props}
                    data={data}
                    content={
                        <div>
                            {data.commonUid && <p>Common UID: {data.commonUid}</p>}
                        </div>
                    }
                />
            }
            editor={
                <Editor {...props}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={
                        <fieldset className={'k-form-fieldset'}>
                            <legend className={'k-form-legend'}>Edit process data</legend>
                            <div className="mb-3">
                                <Field name={'name'} component={Input} label={'Name'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'description'} component={Input} label={'Description'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'commonUid'} component={Input} label={'Common UID'} />
                            </div>
                            <div className="mb-3" style={{ width: '400px' }}>
                                <Field name={'operationGuid'} label={'Operation'}
                                    component={(compProps) =>
                                        <DropDownComp {...compProps}
                                            loading={!ops}
                                            data={ops}
                                            textField='name'
                                            dataItemKey='guid'
                                        />
                                    }
                                />
                            </div>
                        </fieldset>
                    }
                />
            }
            relations={
                <ProcessTabs id={parseInt(id)} api={props.api} missedInputs={missedInputs} onDetailSelected={setSub} />
            }
        />
    );
}

