import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';
import { AuditTabs } from './audit/AuditTabs';

AuditDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    auditId: PropTypes.number,
    params: PropTypes.array,
    onUpdate: PropTypes.func
}

export function AuditDetail({ auditId, ...props }) {
    let { id } = useParams();
    id = auditId || id;
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
                            <p>{`${data.name}`}</p>
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
                            <legend className={'k-form-legend'}>Edit profile data</legend>
                            <div className="mb-3">
                                <Field name={'name'} component={Input} label={'Name'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'description'} component={Input} label={'Description'} />
                            </div>
                        </fieldset>
                    }
                />
            }
            relations={
                <AuditTabs id={parseInt(id)} params={props.params} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}

