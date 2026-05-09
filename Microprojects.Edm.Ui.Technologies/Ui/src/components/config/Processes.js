import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Api from '../api';
import { useGet } from '../hooks/hooks';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Editor } from '../MasterDetail';
import { ProcessTabs } from './process/ProcessTabs';
import { Box } from '@mui/material';
import {
    AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { Properties, Property } from '../forms/Properties';
import { EditorSection } from '../forms/EditorSection';
import { Field } from '../forms/Field';

export function Processes() {
    let { path } = useRouteMatch();
    const history = useHistory();
    const api = Api.processes;
    return (
        <MasterDetail
            api={api}
            path={path}
            stubMessage='Please select a process'
            detail={
                <ProcessDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => history.push(path)}
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
    id = processId || parseInt(id);
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    const [[ops]] = useGet(`${Api.plugins}/operations`, []);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
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
                missedInputs.length > 0 ?
                    `Parameter${missedInputs.length > 1 ? 's' : ''} ${missedInputs.join(', ')} ${missedInputs.length > 1 ? 'are' : 'is'} not available as output parameters` : ''
            }
            data={data}
            parents={parents}
            subDetail={sub}
            card={
                <Properties>
                    <Property
                        label="Operation"
                        value={operationName}
                        muted={!operationName}
                        placeholder="Not bound"
                    />
                    <Property
                        label="Common UID"
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
                                    title="Identity"
                                    filled={identityFilled}
                                    total={3}
                                    done={identityFilled === 3 && identityValid}
                                >
                                    <Field
                                        full
                                        name="name"
                                        label="Name"
                                        required
                                        value={values.name}
                                        onChange={handleChange}
                                        state={values.name && values.name.trim() ? 'pristine' : (values.id ? 'invalid' : 'pristine')}
                                        help={
                                            values.id && (!values.name || !values.name.trim())
                                                ? 'A process must have a name.'
                                                : 'Shown across the tree, breadcrumbs, and dispatch board.'
                                        }
                                    />
                                    <Field
                                        full
                                        kind="textarea"
                                        name="description"
                                        label="Description"
                                        rows={2}
                                        value={values.description}
                                        onChange={handleChange}
                                        help="Free-form notes — what this process does, where it's used."
                                    />
                                    <Field
                                        full
                                        name="commonUid"
                                        label="Common UID"
                                        value={values.commonUid}
                                        onChange={handleChange}
                                        placeholder="e.g. 7G-MNT-014"
                                        help="Stable identifier shared with external systems (ERP, MES). Optional."
                                    />
                                </EditorSection>

                                <EditorSection
                                    number={2}
                                    title="Operation binding"
                                    filled={operationFilled}
                                    total={1}
                                    done={operationFilled === 1 && missedInputs.length === 0}
                                    defaultCollapsed={!values.operationGuid && !!values.name}
                                >
                                    <Field
                                        full
                                        kind="select"
                                        name="operationGuid"
                                        label="Operation"
                                        value={values.operationGuid}
                                        onChange={handleChange}
                                        placeholder="No operation"
                                        options={(ops || []).map(op => ({ value: op.guid, label: op.name }))}
                                        state={missedInputs.length > 0 ? 'warn' : (values.operationGuid ? 'ok' : 'pristine')}
                                        help={
                                            missedInputs.length > 0
                                                ? `${missedInputs.length} parameter${missedInputs.length > 1 ? 's' : ''} unresolved: ${missedInputs.join(', ')}`
                                                : values.operationGuid
                                                    ? 'Operation is wired to upstream parameters.'
                                                    : 'Pick the operation plugin that drives this process.'
                                        }
                                    />
                                </EditorSection>
                            </Box>
                        );
                    }}
                />
            }
            relations={
                <ProcessTabs id={parseInt(id)} api={props.api} missedInputs={missedInputs} onDetailSelected={setSub} />
            }
        />
    );
}
