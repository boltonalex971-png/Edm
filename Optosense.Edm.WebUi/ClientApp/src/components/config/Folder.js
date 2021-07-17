import React from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';
import { Detail, Info, Editor } from '../MasterDetail';
import { useParams } from 'react-router-dom';

Folder.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    type: PropTypes.string
}

export function Folder(props) {
    let { id } = useParams();
    id = parseInt(id);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '', url: '' };
    }
    return (
        <Detail {...props}
            copyable={false}
            id={id}
            icon={<span className='k-icon k-i-folder' title='Folder' />}
            loading={loading}
            error={error}
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
                        </fieldset>
                    }
                />
            }
        />
    );
}

