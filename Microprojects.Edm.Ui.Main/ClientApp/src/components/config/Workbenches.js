import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';
import { ProfileTabs } from './profile/ProfileTabs';
import { WorkbenchDevicesTab } from './workplace/WorkbenchDevicesTab';
import { Button } from '@progress/kendo-react-buttons';
import axios from 'axios';
import api from '../api';

WorkbenchDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    workbenchId: PropTypes.number,
    onUpdate: PropTypes.func
}

export function WorkbenchDetail({ workbenchId, ...props }) {
    let { id } = useParams();
    id = workbenchId || id;
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '', url: '' };
    }
    const onOperationStart = () => {
        const opData = {
            id: 0,
            workbenchId: id,
        };
        axios.post(api.operations, opData)
            .then((op) => {
                axios.get(`${api.plugins}/${data.operationGuid}`)
                    .then((pl) => {
                        window.open(`${pl.data.homepage}?id=${op.data.id}`, '_blank');
                    });
            })
            .catch(alert);
    };

    return (
        <Detail {...props}
            id={id}
            loading={loading}
            error={error}
            data={data}
            subDetail={sub}
            copyable={false}
            deletable={false}
            card={
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'baseline' }}>
                        <h6>Device configurations</h6>
                        <Button type='button' themeColor='primary' icon='play' className='mb-2' onClick={onOperationStart} >Start operation</Button>
                    </div>
                    {data.commonUid && <p>Common UID: {data.commonUid}</p>}
                    <WorkbenchDevicesTab id={parseInt(id)} processId={data.processId} api={props.api} onDetailSelected={setSub} />
                </>
            }
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
                                <Field name={'commonUid'} component={Input} label={'Common UID'} />
                            </div>
                        </fieldset>
                    }
                />
            }
        />
    );
}

