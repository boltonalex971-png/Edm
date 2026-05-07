import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor, InfoItem } from '../MasterDetail';
import { AuditTabs } from './audit/AuditTabs';
import { TextField, Box } from '@mui/material';
import { FactCheck as AuditIcon } from '@mui/icons-material';


AuditDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    auditId: PropTypes.number,
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
    if (!data || data.id === 0) {
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
            card={
                <Info {...props}
                    data={data}
                    content={
                        <>
                            <InfoItem label="Audit Name" value={data.name} />
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
                <AuditTabs id={parseInt(id)} params={props.params} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}

