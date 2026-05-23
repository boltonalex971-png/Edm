import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Api from '../api';
import { useGet } from '@microprojects/edm-components/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBasePath } from '@microprojects/edm-components/hooks';
import { MasterDetail, reloadMaster, Detail, Editor } from '@microprojects/edm-components/components';
import { ProcessTabs } from './process/ProcessTabs';
import { Box } from '@mui/material';
import {
    AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { Properties, Property } from '@microprojects/edm-components/components';
import { EditorSection } from '@microprojects/edm-components/components';
import { Field } from '@microprojects/edm-components/components';

export function Processes() {
    const path = useBasePath();
    const navigate = useNavigate();
    const api = Api.processes;
    const { t } = useTranslation('tech');
    return (
        <MasterDetail
            api={api}
            hierarchiesApi={Api.directories}

            path={path}
            stubMessage={t('config.stub.process')}
            detail={
                <ProcessDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => navigate(path)}
                />
            }
        />
    );
}

ProcessDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    processId: PropTypes.number,
    onUpdate: PropTypes.func
}

export function ProcessDetail({ processId, parents, ...props }) {
    const type = 'process';
    let { id } = useParams();
    id = processId || id;
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    const [[ops]] = useGet(`${Api.plugins}/operations`, []);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    const { t } = useTranslation('tech');
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '' };
    }

    const missedInputs = JSON.parse(data.message || '[]');
    const operationName = ops?.find(o => o.guid === data.operationGuid)?.name;

    return (
        <Detail {...props}
            id={id}
            type={type}
            icon={<AccountTreeIcon />}
            loading={loading}
            error={error}
            validation={
                missedInputs.length > 0
                    ? t('process.paramSingular', { count: missedInputs.length, params: missedInputs.join(', ') })
                    : ''
            }
            data={data}
            parents={parents}
            subDetail={sub}
            card={
                <Properties>
                    <Property
                        label={t('process.operation')}
                        value={operationName}
                        muted={!operationName}
                        placeholder={t('process.operationNotBound')}
                    />
                    <Property
                        label={t('process.commonUid')}
                        value={data.commonUid}
                        mono
                        placeholder="—"
                    />
                </Properties>
            }
            editor={
                <Editor {...props}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => {
                        const identityFilled = [values.name, values.description, values.commonUid]
                            .filter(v => v && String(v).trim().length > 0).length;
                        const identityValid = !!(values.name && values.name.trim().length > 0);
                        const operationFilled = values.operationGuid ? 1 : 0;

                        return (
                            <Box>
                                <EditorSection
                                    number={1}
                                    title={t('common.identity')}
                                    filled={identityFilled}
                                    total={3}
                                    done={identityFilled === 3 && identityValid}
                                >
                                    <Field
                                        full
                                        name="name"
                                        label={t('common.name')}
                                        required
                                        value={values.name}
                                        onChange={handleChange}
                                        state={values.name && values.name.trim() ? 'pristine' : (values.id ? 'invalid' : 'pristine')}
                                        help={
                                            values.id && (!values.name || !values.name.trim())
                                                ? t('process.nameMissing')
                                                : t('process.nameHelp')
                                        }
                                    />
                                    <Field
                                        full
                                        kind="textarea"
                                        name="description"
                                        label={t('common.description')}
                                        rows={2}
                                        value={values.description}
                                        onChange={handleChange}
                                        help={t('process.descriptionHelp')}
                                    />
                                    <Field
                                        full
                                        name="commonUid"
                                        label={t('process.commonUid')}
                                        value={values.commonUid}
                                        onChange={handleChange}
                                        placeholder={t('process.commonUidPlaceholder')}
                                        help={t('process.commonUidHelp')}
                                    />
                                </EditorSection>

                                <EditorSection
                                    number={2}
                                    title={t('process.operationBinding')}
                                    filled={operationFilled}
                                    total={1}
                                    done={operationFilled === 1 && missedInputs.length === 0}
                                    defaultCollapsed={!values.operationGuid && !!values.name}
                                >
                                    <Field
                                        full
                                        kind="select"
                                        name="operationGuid"
                                        label={t('process.operation')}
                                        value={values.operationGuid}
                                        onChange={handleChange}
                                        placeholder={t('process.noOperation')}
                                        options={(ops || []).map(op => ({ value: op.guid, label: op.name }))}
                                        state={missedInputs.length > 0 ? 'warn' : (values.operationGuid ? 'ok' : 'pristine')}
                                        help={
                                            missedInputs.length > 0
                                                ? t('process.paramUnresolved', { count: missedInputs.length, params: missedInputs.join(', ') })
                                                : values.operationGuid
                                                    ? t('process.operationWired')
                                                    : t('process.operationHelp')
                                        }
                                    />
                                </EditorSection>
                            </Box>
                        );
                    }}
                />
            }
            relations={
                <ProcessTabs id={id} api={props.api} missedInputs={missedInputs} onDetailSelected={setSub} />
            }
        />
    );
}
