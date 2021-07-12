import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';
import { WorkplaceTabs } from './workplace/WorkplaceTabs';
import Api from '../api';

export function Workplaces() {
    let { path } = useRouteMatch();
    const history = useHistory();
    const api = Api.workplaces;
    return (
        <MasterDetail
            api={api}
            path={path}
            stubMessage='Please select a workplace'
            detail={(
                <WorkplaceDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => history.push(path)}
                />
            )}
        />
    );
}

WorkplaceDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string
}

export function WorkplaceDetail(props) {
    let { id } = useParams();
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '' };
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
                            <legend className={'k-form-legend'}>Edit workplace data</legend>
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
                <WorkplaceTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}

