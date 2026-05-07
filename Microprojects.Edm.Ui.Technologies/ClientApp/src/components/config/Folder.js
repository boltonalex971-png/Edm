import React from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Detail, Info, Editor, InfoItem } from '../MasterDetail';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TextField, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { Folder as FolderIcon } from '@mui/icons-material';

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
            card={
                <Info {...props}
                    data={data}
                    content={
                        <>
                            <InfoItem label="Folder Name" value={data.name} />
                            <InfoItem label="Description" value={data.description} />
                            {data.group && <InfoItem label="Division" value={data.group} />}
                        </>
                    }
                />
            }
            editor={
                <Editor {...props}
                    type={type}
                    data={data}
                    setData={setData}
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
                            <FormControl fullWidth size="small">
                                <InputLabel>Division</InputLabel>
                                <Select
                                    name="group"
                                    value={values.group || ''}
                                    onChange={handleChange}
                                    label="Division"
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {user?.divisions?.map((division) => (
                                        <MenuItem key={division} value={division}>
                                            {division}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                />
            }
        />
    );
}
