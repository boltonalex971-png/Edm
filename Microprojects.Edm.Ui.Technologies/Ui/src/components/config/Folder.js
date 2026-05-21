import React from 'react';
import PropTypes from 'prop-types';
import { useGet } from '@microprojects/edm-components/hooks';
import { Detail, Editor } from '@microprojects/edm-components/components';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { Folder as FolderIcon } from '@mui/icons-material';
import { Properties, Property } from '@microprojects/edm-components/components';
import { EditorSection } from '@microprojects/edm-components/components';
import { Field } from '@microprojects/edm-components/components';

Folder.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    entityType: PropTypes.string
}

export function Folder(props) {
    const type = 'folder';
    // entityType is the capitalized HierarchyType (Workplace/Process/Host/Device) supplied
    // by MasterDetail from its api URL. Sent as the POST body's `type` so the backend's
    // HierarchyType enum binder accepts it; falling back to 'folder' (binder rejects)
    // makes the failure loud rather than silently dropping rows into the wrong bucket.
    const editorType = props.entityType || type;
    const user = useSelector(s => s.user)
    const { t } = useTranslation('tech');
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
                    <Property label={t('folder.division')} value={data.group} />
                </Properties>
            ) : null}
            editor={
                <Editor {...props}
                    type={editorType}
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
                                    title={t('common.identity')}
                                    filled={identityFilled}
                                    total={2}
                                    done={identityFilled === 2 && !nameMissing}
                                >
                                    <Field
                                        full
                                        name="name"
                                        label={t('common.name')}
                                        required
                                        value={values.name}
                                        onChange={handleChange}
                                        state={nameMissing ? 'invalid' : 'pristine'}
                                        help={nameMissing ? t('folder.nameMissing') : t('folder.nameHelp')}
                                    />
                                    <Field
                                        full
                                        kind="textarea"
                                        name="description"
                                        label={t('common.description')}
                                        rows={2}
                                        value={values.description}
                                        onChange={handleChange}
                                    />
                                </EditorSection>

                                {divisions.length > 0 && (
                                    <EditorSection
                                        number={2}
                                        title={t('folder.organization')}
                                        filled={values.group ? 1 : 0}
                                        total={1}
                                        done={!!values.group}
                                    >
                                        <Field
                                            full
                                            kind="select"
                                            name="group"
                                            label={t('folder.division')}
                                            value={values.group}
                                            onChange={handleChange}
                                            placeholder={t('folder.noDivision')}
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
