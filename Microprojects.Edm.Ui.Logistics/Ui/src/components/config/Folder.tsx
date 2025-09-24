import React, {type MouseEventHandler} from 'react';
import { useGet } from '../../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';
import {Detail, Info, Editor, EMPTY_GUID} from '../MasterDetail';
import { useParams } from 'react-router-dom';
import { DropDownComp } from '../DropDownCell';
import { useGetUserQuery } from '../../features/api/apiSlice';
import type {TreeNode} from "../../data/types";  

type FolderProps = {
    onChange: () => void,
    onClose: MouseEventHandler,
    path: string,
    api: string,
    type: string
}

export function Folder(props : FolderProps) {
    const { data: user, error : userError, isLoading } = useGetUserQuery()
    const { id } = useParams();
    let [[data, setData], loading, error] = useGet<TreeNode>(`${props.api}/${id}`, [id]);
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '', url: '' } as TreeNode
    }
    return (
        <Detail {...props}
            copyable={false}
            id={id}
            icon={<span className='k-icon k-i-folder' title='Folder' />}
            loading={loading}
            error={userError?.toString()}
            data={data}
            card={
                <Info {...props}
                    data={data}
                    content={
                        <div>
                            <p>{`${data.name}`}</p>
                            <small>{`${data.description}`}</small>
                        </div>
                    }
                />
            }
            editor={
                <Editor {...props}
                    type={props.type}
                    data={data}
                    setData={setData}
                    content={
                        <fieldset className={'k-form-fieldset'}>
                            <legend className={'k-form-legend'}>Edit folder</legend>
                            <div className="mb-3">
                                <Field name={'name'} component={Input} label={'Name'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'description'} component={Input} label={'Description'} />
                            </div>
                            <div className="mb-3" style={{ width: '400px' }}>
                                <Field name={'groups'} label={'Groups'}
                                    component={(compProps) =>
                                        <DropDownComp {...compProps}
                                            loading={!user}
                                            data={user?.groups}
                                            textField='name'
                                            dataItemKey='sid'
                                        />
                                    }
                                />
                            </div>
                        </fieldset>
                    }
                />
            }
        />
    );
}

