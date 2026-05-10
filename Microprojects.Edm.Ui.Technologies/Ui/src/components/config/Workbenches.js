import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '@microprojects/edm-components/hooks';
import { useHistory, useParams } from 'react-router-dom';
import { Detail, Editor } from '@microprojects/edm-components/components';
import { WorkbenchDevicesTab } from './workplace/WorkbenchDevicesTab';
import { Box, Button as MuiButton, Typography } from '@mui/material';
import { PlayArrow as PlayIcon, Handyman as WorkbenchIcon } from '@mui/icons-material';
import axios from 'axios';
import api from '../api';
import { useDispatch } from 'react-redux';
import { setProcess, setWorkbench } from '../../slices/newOperationSlice.ts';
import { Properties, Property } from '@microprojects/edm-components/components';
import { EditorSection } from '@microprojects/edm-components/components';
import { Field } from '@microprojects/edm-components/components';


WorkbenchDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    workbenchId: PropTypes.number,
    onUpdate: PropTypes.func
}

export function WorkbenchDetail({ workbenchId, parents, ...props }) {
    const type = 'workbench';
    const history = useHistory()
    const dispatch = useDispatch()
    let { id } = useParams();
    id = workbenchId || id;
    let [sub, setSub] = useState();
    const [proc, setProc] = useState()
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id], data => {
        axios.get(`${api.workplaces}/processes/${data.workplaceProcessId}`)
            .then(response => setProc(response.data))
    });
    const onOperationStart = () => {
        dispatch(setWorkbench(data))
        dispatch(setProcess(proc))
        history.push('/operation')
    };
    useEffect(setSub, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '', url: '' };
    }

    const showProperties = !!data.commonUid;

    return (
        <Detail {...props}
            id={id}
            type={type}
            icon={<WorkbenchIcon />}
            loading={loading}
            error={error}
            data={data}
            parents={parents}
            subDetail={sub}
            copyable={false}
            deletable={false}
            card={showProperties ? (
                <Properties>
                    <Property label="Common UID" value={data.commonUid} mono />
                </Properties>
            ) : null}
            relations={
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                            Device configurations
                        </Typography>
                        <MuiButton
                            variant="contained"
                            color="primary"
                            startIcon={<PlayIcon />}
                            onClick={onOperationStart}
                            size="small"
                        >
                            Start operation
                        </MuiButton>
                    </Box>
                    <WorkbenchDevicesTab id={parseInt(id)} processId={data.processId} api={props.api} onDetailSelected={setSub} />
                </Box>
            }
            editor={
                <Editor {...props}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => {
                        const identityFilled = [values.name, values.description, values.commonUid]
                            .filter(v => v && String(v).trim().length > 0).length;
                        const nameMissing = !!values.id && (!values.name || !values.name.trim());

                        return (
                            <Box>
                                <EditorSection
                                    number={1}
                                    title="Identity"
                                    filled={identityFilled}
                                    total={3}
                                    done={identityFilled === 3 && !nameMissing}
                                >
                                    <Field
                                        full
                                        name="name"
                                        label="Name"
                                        required
                                        value={values.name}
                                        onChange={handleChange}
                                        state={nameMissing ? 'invalid' : 'pristine'}
                                        help={nameMissing ? 'A workbench must have a name.' : 'Shown across the tree, breadcrumbs, and dispatch board.'}
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
                                    <Field
                                        full
                                        name="commonUid"
                                        label="Common UID"
                                        value={values.commonUid}
                                        onChange={handleChange}
                                        placeholder="e.g. WB-014-A"
                                        help="Stable identifier shared with external systems (ERP, MES). Optional."
                                    />
                                </EditorSection>
                            </Box>
                        );
                    }}
                />
            }
        />
    );
}
