import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '@microprojects/edm-components/hooks';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Detail, Editor, EMPTY_GUID } from '@microprojects/edm-components/components';
import { AuditTabs } from './audit/AuditTabs';
import { Box } from '@mui/material';
import { FactCheck as AuditIcon } from '@mui/icons-material';
import { EditorSection } from '@microprojects/edm-components/components';
import { Field } from '@microprojects/edm-components/components';


AuditDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    auditId: PropTypes.string,
    params: PropTypes.array,
    onUpdate: PropTypes.func
}

export function AuditDetail({ auditId, parents, ...props }) {
    const type = 'audit';
    let { id } = useParams();
    id = auditId || id;
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    const { t } = useTranslation('tech');
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '', url: '' };
    }
    return (
        <Detail {...props}
            id={id}
            type={type}
            icon={<AuditIcon />}
            loading={loading}
            error={error}
            data={data}
            parents={parents}
            subDetail={sub}
            editor={
                <Editor {...props}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => {
                        const identityFilled = [values.name, values.description]
                            .filter(v => v && String(v).trim().length > 0).length;
                        const nameMissing = !!values.id && (!values.name || !values.name.trim());

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
                                        help={nameMissing ? t('audit.nameMissing') : t('audit.nameHelp')}
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
                            </Box>
                        );
                    }}
                />
            }

            relations={
                <AuditTabs id={id} params={props.params} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}
