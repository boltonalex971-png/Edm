import React, {useEffect, useState} from 'react';
import { 
    Box, 
    Typography, 
    Card, 
    CardContent, 
    Grid, 
    Tabs, 
    Tab, 
    IconButton, 
    Menu, 
    MenuItem,
    Stack,
    Divider
} from '@mui/material';
import api, {spaUrl} from '../api';
import {useGet} from '../hooks/hooks';
import {Loading, dateToHumanSpan, utcDateToLocal} from '../utils/Utils';
import {useParams, useLocation, useHistory} from "react-router-dom";
import MoreVertIcon from '@mui/icons-material/MoreVert'
import Axios from "axios";
import {useToast} from "../states/Toast";
import styles from './Operations.module.scss';

let interval;

const Operations = () => {
    let location = useLocation();
    let history = useHistory();
    let {when} = useParams();
    const period = when ?? 'running';
    const basePath = location.pathname.replace(`/${when}`, '');

    const handleTabChange = (event, newValue) => {
        history.push(`${basePath}/${newValue}`);
    };

    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={period} onChange={handleTabChange} aria-label="operations tabs">
                    <Tab label="Running" value="running" sx={{ textTransform: 'none' }} />
                    <Tab label="Today" value="today" sx={{ textTransform: 'none' }} />
                    <Tab label="Week" value="week" sx={{ textTransform: 'none' }} />
                </Tabs>
            </Box>
            <OperationsWhen period={period}/>
        </Box>
    )
}

const OperationsWhen = ({period}) => {
    const [menu, setMenu] = useState(null);
    const [time, setTime] = useState();
    const [[operations]] = useGet(`${api.operations}/${period}`, [time, period], null, true);
    const toast = useToast();

    const openCardMenu = (ev, operationId) => {
        ev.stopPropagation();
        setMenu({target: ev.currentTarget, id: operationId});
    }
    const closeCardMenu = (ev) => {
        setMenu(null);
    }
    const errorOf = (error, fallback) =>
        error.response?.data?.detail || error.response?.data?.title || error.message || fallback;
    const completeOperation = (ev) => {
        Axios.post(`${api.operations}/${menu.id}/complete`)
            .then(() => {
                toast.success('Operation completed');
                setTime(Date.now());
            })
            .catch((error) => toast.error(errorOf(error, 'Failed to complete operation')))
            .finally(() => setMenu(null));
    }
    const copyOperation = (ev) => {
        Axios.post(`${api.operations}/${menu.id}`)
            .then((response) => {
                window.open(spaUrl(`/operations/${response.data.id}`), '_blank');
            })
            .catch((error) => toast.error(errorOf(error, 'Failed to copy operation')))
            .finally(() => setMenu(null));
    };

    useEffect(() => {
        interval = setInterval(() => setTime(Date.now), 10000);
        return () => clearInterval(interval);
    }, []);

    const getStatusClass = (state) => {
        switch (state) {
            case 'Faulted': return styles.faulted;
            case 'Idle': return styles.idle;
            case 'Scheduled': return styles.scheduled;
            case 'InProgress': return styles.inProgress;
            case 'Completed': return styles.completed;
            case 'Cancelled': return styles.cancelled;
            default: return '';
        }
    };

    const getStatusLabelClass = (state) => {
        switch (state) {
            case 'Faulted': return styles.faulted;
            case 'Idle': return styles.idle;
            case 'Scheduled': return styles.scheduled;
            case 'InProgress': return styles.inProgress;
            default: return styles.default;
        }
    };

    return (
        <>
            {operations?.length === 0 &&
                <Typography sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    {period === 'today' ?
                        'No operation was completed today' : period === 'week' ?
                            'No operation was completed last 7 days' :
                            'No operation is running at the moment'
                    }
                </Typography>
            }
            {operations &&
                <Box className={styles.cardGrid}>
                    {operations.map((o) => (
                        <Card 
                            key={o.id}
                            onClick={() => window.open(spaUrl(`/operations/${o.id}`), '_blank')}
                            className={`${styles.opCard} ${getStatusClass(o.state)}`}
                        >
                            <Box className={styles.headerRow}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    #{o.id}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1, textAlign: 'center', px: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {o.workplaceName}
                                </Typography>
                                <IconButton 
                                    size="small"
                                    className={styles.moreBtn}
                                    onClick={(ev) => openCardMenu(ev, o.id)}
                                >
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <CardContent className={styles.cardContent}>
                                <Typography className={styles.processName}>
                                    {o.processName}
                                </Typography>
                                <Divider sx={{ mb: 1 }} />
                                <Box className={styles.metaRow}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                                        Created {dateToHumanSpan(utcDateToLocal(o.created))}
                                    </Typography>
                                    {o.started && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                                            Started {dateToHumanSpan(utcDateToLocal(o.started))}
                                        </Typography>
                                    )}
                                    {o.completed && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                                            Completed {dateToHumanSpan(utcDateToLocal(o.completed))}
                                        </Typography>
                                    )}
                                    <Typography 
                                        className={`${styles.statusLabel} ${getStatusLabelClass(o.state)}`}
                                    >
                                        {o.state}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            }

            <Menu 
                anchorEl={menu?.target}
                open={!!menu}
                onClose={closeCardMenu}
                disableScrollLock
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {period === 'running' && 
                    <MenuItem onClick={completeOperation}>Complete</MenuItem>
                }
                <MenuItem onClick={copyOperation}>Copy</MenuItem>
            </Menu>
        </>
    );
};

export default Operations;
