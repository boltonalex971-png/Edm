import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '@microprojects/edm-components/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBasePath } from '@microprojects/edm-components/hooks';
import { Business as BusinessIcon } from '@mui/icons-material';
import { MasterDetail, reloadMaster, Detail, Editor } from '@microprojects/edm-components/components';
import { Box } from '@mui/material';
import { WorkplaceTabs } from './workplace/WorkplaceTabs';
import { Folder } from './Folder';
import Api from '../api';
import { EditorSection } from '@microprojects/edm-components/components';
import { Field } from '@microprojects/edm-components/components';


export function Workplaces() {
    const path = useBasePath();
    const navigate = useNavigate();
    const api = Api.workplaces;
    const { t } = useTranslation('tech');
    return (
        <MasterDetail
            api={api}
            hierarchiesApi={Api.hierarchies}
            folderComponent={Folder}
            path={path}
            stubMessage={t('config.stub.workplace')}
            detail={(
                <WorkplaceDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => navigate(path)}
                />
            )}
        />
    );
}

WorkplaceDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    workplaceId: PropTypes.number,
    onUpdate: PropTypes.func
}

export function WorkplaceDetail({ workplaceId, parents, ...props }) {
    const type = 'workplace';
    let { id } = useParams();
    id = workplaceId || parseInt(id);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    let [sub, setSub] = useState();
    const { t } = useTranslation('tech');
    useEffect(setSub, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '' };
    }
    return (
        <Detail {...props}
            id={id}
            type={type}
            icon={<BusinessIcon />}
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
                                        help={nameMissing ? t('workplace.nameMissing') : t('workplace.nameHelp')}
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
                <WorkplaceTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}
