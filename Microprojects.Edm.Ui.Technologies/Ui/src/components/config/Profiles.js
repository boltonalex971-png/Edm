import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor, InfoItem } from '../MasterDetail';
import { ProfileTabs } from './profile/ProfileTabs';
import { TextField, Box, Chip, Autocomplete } from '@mui/material';
import { Description as ProfileIcon } from '@mui/icons-material';


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
                <Info {...props}
                    data={data}
                    content={
                        <>
                            <InfoItem label="Profiler" value={data.profilerName || 'No profiler attached'} />
                            <InfoItem label="Input Parameters" xs={12}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {JSON.parse(data.input || '[]').map((param) => (
                                        <Chip key={param} label={param} size="small" variant="outlined" sx={{ borderRadius: '4px' }} />
                                    ))}
                                    {JSON.parse(data.input || '[]').length === 0 && "—"}
                                </Box>
                            </InfoItem>
                            <InfoItem label="Output Parameters" xs={12}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {JSON.parse(data.output || '[]').map((param) => (
                                        <Chip key={param} label={param} size="small" variant="outlined" sx={{ borderRadius: '4px' }} />
                                    ))}
                                    {JSON.parse(data.output || '[]').length === 0 && "—"}
                                </Box>
                            </InfoItem>
                        </>
                    }
                />
            }
            editor={
                <Editor {...props}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <TextField
                                fullWidth
                                label="Name"
                                name="name"
                                value={values.name || ''}
                                onChange={handleChange}
                                size="small"
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={values.description || ''}
                                onChange={handleChange}
                                size="small"
                                multiline
                                rows={2}
                            />
                            <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={JSON.parse(values.input || '[]')}
                                onChange={(event, newValue) => {
                                    handleChange({ target: { name: 'input', value: JSON.stringify(newValue) } });
                                }}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip 
                                            variant="outlined" 
                                            label={option} 
                                            size="small" 
                                            sx={{ borderRadius: '4px' }} 
                                            {...getTagProps({ index })} 
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField {...params} label="Input Parameters" placeholder="Add parameters..." size="small" />
                                )}
                            />
                            <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={JSON.parse(values.output || '[]')}
                                onChange={(event, newValue) => {
                                    handleChange({ target: { name: 'output', value: JSON.stringify(newValue) } });
                                }}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip 
                                            variant="outlined" 
                                            label={option} 
                                            size="small" 
                                            sx={{ borderRadius: '4px' }} 
                                            {...getTagProps({ index })} 
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField {...params} label="Output Parameters" placeholder="Add parameters..." size="small" />
                                )}
                            />
                        </Box>
                    )}
                />
            }

            relations={
                <ProfileTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} profiler={data.profilerName} />
            }
        />
    );
}

