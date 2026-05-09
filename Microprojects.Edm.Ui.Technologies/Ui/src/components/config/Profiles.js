import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { useParams } from 'react-router-dom';
import { Detail, Editor } from '../MasterDetail';
import { ProfileTabs } from './profile/ProfileTabs';
import { Box, Chip, TextField, Autocomplete } from '@mui/material';
import { Description as ProfileIcon } from '@mui/icons-material';
import { Properties, Property } from '../forms/Properties';
import { EditorSection } from '../forms/EditorSection';
import { Field } from '../forms/Field';


ProfileDetail.propTypes = {
    onChange: PropTypes.func,
    deletable: PropTypes.bool,
    api: PropTypes.string,
    profileId: PropTypes.number,
    onUpdate: PropTypes.func
}

export function ProfileDetail({ profileId, parents, deletable = true, ...props }) {
    const type = 'profile';
    let { id } = useParams();
    id = profileId || id;
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '', url: '' };
    }

    const inputs = JSON.parse(data.input || '[]');
    const outputs = JSON.parse(data.output || '[]');
    const renderParams = (params) => params.length === 0
        ? <span style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}>None</span>
        : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {params.map(p => (
                    <Chip key={p} label={p} size="small" variant="outlined" />
                ))}
            </Box>
        );

    return (
        <Detail {...props}
            id={id}
            type={type}
            icon={<ProfileIcon />}
            loading={loading}
            error={error}
            data={data}
            parents={parents}
            subDetail={sub}
            deletable={deletable}
            card={
                <Properties>
                    <Property
                        label="Profiler"
                        value={data.profilerName}
                        muted={!data.profilerName}
                        placeholder="No profiler attached"
                        full
                    />
                    <Property
                        label="Input parameters"
                        full
                        multiline
                    >
                        {renderParams(inputs)}
                    </Property>
                    <Property
                        label="Output parameters"
                        full
                        multiline
                    >
                        {renderParams(outputs)}
                    </Property>
                </Properties>
            }
            editor={
                <Editor {...props}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => {
                        const identityFilled = [values.name, values.description]
                            .filter(v => v && String(v).trim().length > 0).length;
                        const inputArr = JSON.parse(values.input || '[]');
                        const outputArr = JSON.parse(values.output || '[]');
                        const paramsFilled = (inputArr.length > 0 ? 1 : 0) + (outputArr.length > 0 ? 1 : 0);
                        const nameMissing = !!values.id && (!values.name || !values.name.trim());

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
                                        help={nameMissing ? 'A profile must have a name.' : 'Shown across the tree, breadcrumbs, and process bindings.'}
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

                                <EditorSection
                                    number={2}
                                    title="Parameters"
                                    filled={paramsFilled}
                                    total={2}
                                    done={paramsFilled === 2}
                                    fillNote={paramsFilled < 2 ? 'declare inputs and outputs' : undefined}
                                >
                                    <ParamsField
                                        label="Input parameters"
                                        name="input"
                                        value={inputArr}
                                        onChange={(v) => handleChange({ target: { name: 'input', value: JSON.stringify(v) } })}
                                        help="Names of parameters this profile consumes from upstream operations."
                                    />
                                    <ParamsField
                                        label="Output parameters"
                                        name="output"
                                        value={outputArr}
                                        onChange={(v) => handleChange({ target: { name: 'output', value: JSON.stringify(v) } })}
                                        help="Names of parameters this profile produces for downstream consumers."
                                    />
                                </EditorSection>
                            </Box>
                        );
                    }}
                />
            }

            relations={
                <ProfileTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} profiler={data.profilerName} />
            }
        />
    );
}

// Parameter chip-list editor — keeps MUI Autocomplete (freeSolo + chips) wrapped
// in a v2-style label/help frame so it sits alongside the Field primitives.
function ParamsField({ label, name, value, onChange, help }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: '1 / -1' }}>
            <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-3)'
            }}>{label}</span>
            <Autocomplete
                multiple
                freeSolo
                size="small"
                options={[]}
                value={value}
                onChange={(event, newValue) => onChange(newValue)}
                renderTags={(vals, getTagProps) =>
                    vals.map((option, index) => (
                        <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />
                    ))
                }
                renderInput={(params) => (
                    <TextField {...params} name={name} placeholder="Add parameter and press Enter" />
                )}
            />
            {help && <span style={{
                fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink-3)'
            }}>{help}</span>}
        </Box>
    );
}
