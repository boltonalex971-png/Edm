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
    workbenchId: PropTypes.number
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
        const data = {
            id: 0,
            workbenchId: id,
        };
        axios.post(api.operations, data)
            .then((op) => {
                window.open(`/app/typeone?id=${op.data.id}`, '_blank');
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
                        <Button type='button' primary icon='play' className='mb-2' onClick={onOperationStart} >Start operation</Button>
                    </div>
                    <WorkbenchDevicesTab id={parseInt(id)} workplaceId={data.workplaceId} api={props.api} onDetailSelected={setSub} />
                </>
            }
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
                        </fieldset>
                    }
                />
            }
        />
    );
}

