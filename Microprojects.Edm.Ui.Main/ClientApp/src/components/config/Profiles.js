import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';
import { ProfileTabs } from './profile/ProfileTabs';
import { MultiSelect } from '@progress/kendo-react-dropdowns';
import { Chip, ChipList } from '@progress/kendo-react-buttons';

ProfileDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    profileId: PropTypes.number
}

export function ProfileDetail({ profileId, ...props }) {
    let { id } = useParams();
    id = profileId || id;
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
                            <p>{`${data.profilerName || 'No profiler attached'}`}</p>
                            <p>
                                <ChipList data={[{ text: "qqq", value: 'qqq' }, { text: "qwqwerqw", value: 'qwqwerqw' }]}
                                    chip={(chipProps) =>
                                        <Chip size='large' fillMode='solid' rounded='medium' />
                                    }
                                />
                            </p>
                            <p></p>
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
                            <legend className={'k-form-legend'}>Edit profile data</legend>
                            <div className="mb-3">
                                <Field name={'name'} component={Input} label={'Name'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'description'} component={Input} label={'Description'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'input'} component={() => <MultiSelect label='Input Parameters' allowCustom={true} />} label={'Input Parameters'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'output'} component={() => <MultiSelect label='Output Parameters' allowCustom={true} />} label={'Output Parameters'} />
                            </div>
                        </fieldset>
                    }
                />
            }
            relations={
                <ProfileTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}

