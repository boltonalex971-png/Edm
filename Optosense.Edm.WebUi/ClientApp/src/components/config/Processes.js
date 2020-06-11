import React from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';
import { Label } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';

export function Processes() {
    let { path } = useRouteMatch();
    const api = '/api/processes';
    return (
        <MasterDetail
            api={api}
            stubMessage='Please select a process'
            detail={
                <ProcessDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                />
            }
        />
    );
}

ProcessDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string
}

function ProcessDetail(props) {
    let { id } = useParams();
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    if (!data || data.id == 0) {
        data = { ...data, name: '', description: '', deviceTypes: '' };
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
                            <Label>Participating devices:</Label>
                            <p>{JSON.parse(data && data.deviceTypes || '[]').join(', ') || '-'}</p>
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
                            <legend className={'k-form-legend'}>Edit process data</legend>
                            <div className="mb-3">
                                <Field name={'name'} component={Input} label={'Name'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'description'} component={Input} label={'Description'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'deviceTypes'} component={Input} label={'Applicable devices'} />
                            </div>
                        </fieldset>
                    }
                />
            }
        />
    );
}

