import React, { useRef, useState, useEffect } from 'react';
import { Link as RouterNavLink } from 'react-router-dom';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Box, 
    TextField, 
    Button, 
    IconButton, 
    Tooltip,
    Stack
} from '@mui/material';
import {
    Home as HomeIcon,
    Settings as SettingsIcon,
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    ContentCopy as CopyIcon,
    Check as CheckIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import Axios from 'axios';
import { useDialog } from "../hooks/DialogHooks";
import useSignalR from "../hooks/signalRHooks.ts";
import api from "../api.js";

export function OperationMenu({ operation, to }) {
    return (
        <AppBar position="static" color="default" elevation={0} sx={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
            <Toolbar variant="dense" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        #{operation.id} <strong>{operation.process.name}</strong>
                    </Typography>
                    
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Home">
                            <IconButton size="small" onClick={() => to('')}>
                                <HomeIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Configuration">
                            <IconButton size="small" onClick={() => to('config')}>
                                <SettingsIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        <Timer />
                    </Typography>
                    <OperationToolbar operation={operation} />
                </Box>
            </Toolbar>
        </AppBar>
    );
}

function Timer() {
    const [timer, setTimer] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setTimer(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);
    
    return timer.toLocaleString('en-GB', { 
        day: '2-digit', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

function OperationToolbar({ operation }) {
    const [status, setStatus] = useState({ state: operation.state, stateTimestamp: operation.stateTimestamp });
    const [loading, setLoading] = useState(false);
    const startAtRef = useRef();
    const { dialog, confirm, alert, warning } = useDialog();
    
    useSignalR(`${api.baseUrl}/hub`, `Operation-${operation.id}-lifecycle`, (message) => setStatus(message));

    const copy = () => {
        setLoading(true);
        Axios.post(`${api.operations}/${operation.id}`)
            .then((response) => {
                window.open(`/operations/${response.data.id}`, '_self');
            })
            .catch((error) => {
                setLoading(false);
                alert({ message: error.response?.data?.detail || 'Failed to copy' });
            });
    };

    const start = () => {
        const value = startAtRef.current?.value;
        const startAt = value ? new Date(value).toISOString() : new Date().toISOString();
        setLoading(true);
        Axios.post(`${api.operations}/${operation.id}/start`, JSON.stringify(startAt), {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(() => setLoading(false))
            .catch((error) => {
                setLoading(false);
                alert({ message: error.response?.data?.detail || 'Failed to start' });
            });
    };

    const stop = (event) => warning({
        target: event.target,
        message: 'Cancel the operation?',
        onConfirm: () => {
            setLoading(true);
            Axios.post(`${api.operations}/${operation.id}/stop`)
                .then(() => setLoading(false))
                .catch((error) => {
                    setLoading(false);
                    alert({ message: error.response?.data?.detail || 'Failed to stop' });
                });
        }
    });

    const complete = (event) => confirm({
        target: event.target,
        message: 'Complete the operation?',
        onConfirm: () => {
            setLoading(true);
            Axios.post(`${api.operations}/${operation.id}/complete`)
                .then(() => setLoading(false))
                .catch((error) => {
                    setLoading(false);
                    alert({ message: error.response?.data?.detail || 'Failed to complete' });
                });
        }
    });

    const close = () => window.close();

    const getStatusLabel = () => {
        switch (status.state) {
            case 'Idle': return 'Start at ';
            case 'Scheduled': return 'Will start at ';
            case 'InProgress': return 'Started at ';
            case 'Completed': return 'Completed at ';
            case 'Cancelled': return 'Cancelled at ';
            case 'Faulted': return 'Checked at ';
            default: return '';
        }
    };

    const timestamp = status.stateTimestamp ? new Date(status.stateTimestamp).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }) : '';

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {dialog}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">
                    {getStatusLabel()}
                </Typography>
                {status.state === 'Idle' ? (
                    <TextField
                        inputRef={startAtRef}
                        type="datetime-local"
                        size="small"
                        defaultValue={new Date().toISOString().slice(0, 16)}
                        sx={{ width: 200 }}
                    />
                ) : (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {timestamp}
                    </Typography>
                )}
                <Typography variant="body2" sx={{ ml: 1, fontWeight: 600, color: 'primary.main' }}>
                    {status.state}
                </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                {status.state === 'Idle' && (
                    <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<PlayIcon />} 
                        onClick={start}
                        disabled={loading}
                    >
                        Start
                    </Button>
                )}
                {status.state === 'InProgress' && (
                    <Button 
                        variant="contained" 
                        color="error"
                        size="small" 
                        startIcon={<StopIcon />} 
                        onClick={stop}
                        disabled={loading}
                    >
                        Stop
                    </Button>
                )}
                {(status.state !== 'InProgress' && status.state !== 'Idle') && (
                    <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<CopyIcon />} 
                        onClick={copy}
                        disabled={loading}
                    >
                        Copy
                    </Button>
                )}
                {(status.state === 'Idle' || status.state === 'Faulted') && (
                    <Button 
                        variant="outlined" 
                        color="success"
                        size="small" 
                        startIcon={<CheckIcon />} 
                        onClick={complete}
                        disabled={loading}
                    >
                        Complete
                    </Button>
                )}
                <Tooltip title="Close window">
                    <IconButton size="small" onClick={close}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Box>
    );
}

