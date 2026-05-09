import React from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Detail, Editor } from '../MasterDetail';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { Folder as FolderIcon } from '@mui/icons-material';
import { Properties, Property } from '../forms/Properties';
import { EditorSection } from '../forms/EditorSection';
import { Field } from '../forms/Field';

Folder.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string
}

export function Folder(props) {
    const type = 'folder';
    const user = useSelector(s => s.user)
    let { id } = useParams();
    id = parseInt(id);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '', url: '' };
    }
    return (
        <Detail {...props}
            type={type}
            copyable={false}
            id={id}
            icon={<FolderIcon />}
            loading={loading}
            error={error}
            data={data}
            card={data.group ? (
                <Properties>
                    <Property label="Division" value={data.group} />
                </Properties>
            ) : null}
            editor={
                <Editor {...props}
                    type={type}
                    data={data}
                    setData={setData}
                    content={({ values, handleChange }) => {
                        const identityFilled = [values.name, values.description]
                            .filter(v => v && String(v).trim().length > 0).length;
                        const nameMissing = !!values.id && (!values.name || !values.name.trim());
                        const divisions = user?.divisions || [];

                        return (
                            <Box>
                                <EditorSection
                                    number={1}
                                    title="Identity"
                                    filled={identityFilled}
                                    total={2}
                                    done={identityFilled === 2 && !nameMissing}
                                >
                                    <Field
                                        full
                                        name="name"
                                        label="Name"
                                        required
                                        value={values.name}
                                        onChange={handleChange}
                                        state={nameMissing ? 'invalid' : 'pristine'}
                                        help={nameMissing ? 'A folder must have a name.' : 'Shown in the master tree.'}
                                    />
                                    <Field
                                        full
                                        kind="textarea"
                                        name="description"
                                        label="Description"
                                        rows={2}
                                        value={values.description}
                                        onChange={handleChange}
                                    />
                                </EditorSection>

                                {divisions.length > 0 && (
                                    <EditorSection
                                        number={2}
                                        title="Organization"
                                        filled={values.group ? 1 : 0}
                                        total={1}
                                        done={!!values.group}
                                    >
                                        <Field
                                            full
                                            kind="select"
                                            name="group"
                                            label="Division"
                                            value={values.group}
                                            onChange={handleChange}
                                            placeholder="No division"
                                            options={divisions.map(d => ({ value: d, label: d }))}
                                        />
                                    </EditorSection>
                                )}
                            </Box>
                        );
                    }}
                />
            }
        />
    );
}
