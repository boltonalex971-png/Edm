import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { Business as BusinessIcon } from '@mui/icons-material';
import { MasterDetail, reloadMaster, Detail, Info, Editor, InfoItem } from '../MasterDetail';
import { TextField, Box } from '@mui/material';
import { WorkplaceTabs } from './workplace/WorkplaceTabs';
import Api from '../api';


export function Workplaces() {
    let { path } = useRouteMatch();
    const history = useHistory();
    const api = Api.workplaces;
    return (
        <MasterDetail
            api={api}
            path={path}
            stubMessage='Please select a workplace'
            detail={(
                <WorkplaceDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => history.push(path)}
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
            card={
                <Info {...props}
                    data={data}
                    content={
                        <>
                            <InfoItem label="Workplace Name" value={data.name} />
                            <InfoItem label="Description" value={data.description} />
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
                        </Box>
                    )}
                />
            }

            relations={
                <WorkplaceTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}

