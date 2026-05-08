import React, {useState} from 'react';
import {useParams} from 'react-router-dom'
import {useGet} from '../hooks/hooks';
import api from '../api';
import {OperationPluginContainer} from './OperationPluginContainer';
import {OperationMenu} from './OperationMenu.js';
import { IconButton, Box, Divider, Typography } from '@mui/material';
import { KeyboardArrowUp as ArrowUpIcon, KeyboardArrowDown as ArrowDownIcon } from '@mui/icons-material';
import axios from 'axios';

export function OperationLayout() {
    const {id} = useParams()
    const [options, setOptions] = useState()
    const [[info]] = useGet(`${api.operations}/${id}/info`, [id], (oi) => {
        axios.get(`${api.plugins}/${oi.process.appGuid}`).then(d => setOptions(d.data)).catch(alert)
    });
    const [to, setTo] = useState('')
    const [hidden, setHidden] = useState(false)
    const saveSettings = (msg) => msg.type === 'Settings' && axios.put(`${api.operations}/${id}/settings`, msg.data)
    
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', position: 'relative' }}>
            {(info && options) && (
                <>
                    <IconButton
                        onClick={() => setHidden((h) => !h)}
                        sx={{ position: 'absolute', top: 8, right: 15, zIndex: 1301, backgroundColor: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'var(--surface)' } }}
                        size="small"
                    >
                        {hidden ? <ArrowDownIcon /> : <ArrowUpIcon />}
                    </IconButton>
                    
                    {!hidden && (
                        <Box sx={{ zIndex: 1300 }}>
                            <OperationMenu
                                operation={info}
                                to={setTo}
                            />
                        </Box>
                    )}

                    <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
                        <OperationPluginContainer
                            title='Operation Console'
                            id={id}
                            info={info}
                            navigate={to}
                            src={`${api.baseUrl}/${options.homepage}?id=${id}`}
                            onMessage={saveSettings}
                        />
                    </Box>

                    {!hidden && (
                        <Box sx={{ p: 1, borderTop: '1px solid var(--line)' }}>
                            <Typography variant="caption" color="textSecondary">
                                &#169; Microprojects {new Date().getFullYear()}
                            </Typography>
                        </Box>
                    )}
                </>
            )}
        </Box>
    )
}


