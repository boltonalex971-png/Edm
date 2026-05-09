import React, {useRef, useState, useEffect} from 'react';
import {
    TextField,
    Button,
    IconButton,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import {
    Home as HomeIcon,
    Settings as SettingsIcon,
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    ContentCopy as CopyIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    KeyboardArrowUp as CollapseIcon,
} from '@mui/icons-material';
import Axios from 'axios';
import {useSelector} from 'react-redux';
import {useDialog} from "../hooks/DialogHooks";
import useSignalR from "../hooks/signalRHooks.ts";
import api, {spaUrl} from "../api.js";
import {useToast} from "../states/Toast";
import {displayUserName} from "../utils/userName";
import styles from './OperationLayout.module.scss';

// Spinner sized to fit the action button's startIcon slot. While an
// action is in flight the icon is swapped for this spinner so the
// operator sees "I'm working on it" and not just a dead disabled button.
const Spinner = () => <CircularProgress size={16} thickness={5} sx={{ color: 'currentColor' }} />;

// HANDOFF · v2 PAT-03 · operator workstation chrome. Single-row layout:
// collapse · #code · process name · home/gear · spacer · status badge ·
// clock · timeline · action buttons · close. Everything aligns on a
// 38 px baseline — no stacked rows, no AppBar/Toolbar chrome.

const STATE_TO_BADGE = {
    Idle:       {kind: 'idle',   label: 'Idle'},
    Scheduled:  {kind: 'queued', label: 'Scheduled'},
    InProgress: {kind: 'run',    label: 'Running'},
    Completed:  {kind: 'idle',   label: 'Completed'},
    Cancelled:  {kind: 'idle',   label: 'Cancelled'},
    Faulted:    {kind: 'fault',  label: 'Faulted'},
};

const STATE_TO_TIMELINE_LABEL = {
    Idle:       'Start at',
    Scheduled:  'Will start at',
    InProgress: 'Started',
    Completed:  'Completed',
    Cancelled:  'Cancelled',
    Faulted:    'Checked',
};

export function OperationMenu({operation, to, onCollapse, collapsed}) {
    const operatorFull = useSelector(s => s.user?.name);
    const operatorShort = displayUserName(operatorFull);

    return (
        <header className={styles.menu} data-collapsed={collapsed ? 'true' : 'false'}>
            <div className={styles.identity}>
                <span className={styles.opCode}>#{operation.id}</span>
                <span className={styles.opSep}>·</span>
                <span className={styles.processName} title={operation.process.name}>
                    {operation.process.name}
                </span>
                {operatorShort && (
                    <>
                        <span className={styles.opSep}>·</span>
                        <span className={styles.operatorName} title={`Operator: ${operatorFull}`}>
                            {operatorShort}
                        </span>
                    </>
                )}
            </div>

            <div className={styles.navGroup}>
                <Tooltip title="Home">
                    <IconButton size="small" className={styles.navBtn} onClick={() => to('')}>
                        <HomeIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Configuration">
                    <IconButton size="small" className={styles.navBtn} onClick={() => to('config')}>
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </div>

            <div className={styles.spacer} />

            <OperationToolbar operation={operation} />

            <button
                type="button"
                className={styles.collapseInline}
                onClick={onCollapse}
                title="Hide toolbar"
                aria-label="Hide toolbar"
            >
                <CollapseIcon fontSize="small" />
            </button>
        </header>
    );
}

function Clock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span className={styles.clock}>
            {now.toLocaleString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })}
        </span>
    );
}

function OperationToolbar({operation}) {
    const [status, setStatus] = useState({state: operation.state, stateTimestamp: operation.stateTimestamp});
    // Per-action loading flag — the operator sees a spinner inside the
    // exact button they pressed while the request is in flight.
    const [busy, setBusy] = useState(null);
    const startAtRef = useRef();
    const {dialog, confirm, warning} = useDialog();
    const toast = useToast();

    useSignalR(`${api.baseUrl}/hub`, `Operation-${operation.id}-lifecycle`, (message) => {
        setStatus(message);
        setBusy(null);
    });

    const errorOf = (error, fallback) =>
        error.response?.data?.detail || error.response?.data?.title || error.message || fallback;

    const copy = () => {
        setBusy('copy');
        Axios.post(`${api.operations}/${operation.id}`)
            .then((response) => {
                window.open(spaUrl(`/operations/${response.data.id}`), '_self');
            })
            .catch((error) => {
                setBusy(null);
                toast.error(errorOf(error, 'Failed to copy operation'));
            });
    };

    const start = () => {
        const value = startAtRef.current?.value;
        const startAt = value ? new Date(value).toISOString() : new Date().toISOString();
        setBusy('start');
        Axios.post(`${api.operations}/${operation.id}/start`, JSON.stringify(startAt), {
            headers: {'Content-Type': 'application/json'}
        })
            .catch((error) => {
                setBusy(null);
                toast.error(errorOf(error, 'Failed to start operation'));
            });
    };

    const stop = () => warning({
        title: 'Stop operation?',
        message: 'The current operation will be cancelled. Any unsaved progress is lost.',
        actionLabel: 'Stop operation',
        onConfirm: () => {
            setBusy('stop');
            Axios.post(`${api.operations}/${operation.id}/stop`)
                .catch((error) => {
                    setBusy(null);
                    toast.error(errorOf(error, 'Failed to stop operation'));
                });
        }
    });

    const complete = () => confirm({
        title: 'Complete operation?',
        message: 'Mark this operation as complete. It will move to the completed list.',
        actionLabel: 'Complete',
        onConfirm: () => {
            setBusy('complete');
            Axios.post(`${api.operations}/${operation.id}/complete`)
                .catch((error) => {
                    setBusy(null);
                    toast.error(errorOf(error, 'Failed to complete operation'));
                });
        }
    });

    const close = () => window.close();

    const badge = STATE_TO_BADGE[status.state] || {kind: 'idle', label: status.state || ''};
    const timelineLabel = STATE_TO_TIMELINE_LABEL[status.state] || '';
    const timestamp = status.stateTimestamp ? new Date(status.stateTimestamp).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }) : '';

    return (
        <div className={styles.cluster}>
            {dialog}

            <Clock />

            <span className={`badge ${badge.kind}`}>
                <span className="dot" />
                {badge.label}
            </span>

            <div className={styles.timeline}>
                <span className={styles.timelineLabel}>{timelineLabel}</span>
                {status.state === 'Idle' ? (
                    <TextField
                        inputRef={startAtRef}
                        type="datetime-local"
                        size="small"
                        defaultValue={new Date().toISOString().slice(0, 16)}
                        className={styles.startAt}
                    />
                ) : (
                    timestamp && <span className={styles.timelineValue}>{timestamp}</span>
                )}
            </div>

            {status.state === 'Idle' && (
                <Button
                    variant="contained"
                    startIcon={busy === 'start' ? <Spinner /> : <PlayIcon />}
                    onClick={start}
                    disabled={!!busy}
                    className={`${styles.action} ${styles.start}`}
                >
                    Start
                </Button>
            )}
            {status.state === 'InProgress' && (
                <Button
                    variant="contained"
                    startIcon={busy === 'stop' ? <Spinner /> : <StopIcon />}
                    onClick={stop}
                    disabled={!!busy}
                    className={`${styles.action} ${styles.stop}`}
                >
                    Stop
                </Button>
            )}
            {(status.state !== 'InProgress' && status.state !== 'Idle') && (
                <Button
                    variant="outlined"
                    startIcon={busy === 'copy' ? <Spinner /> : <CopyIcon />}
                    onClick={copy}
                    disabled={!!busy}
                    className={`${styles.action} ${styles.copy}`}
                >
                    Copy
                </Button>
            )}
            {(status.state === 'Idle' || status.state === 'Faulted') && (
                <Button
                    variant="outlined"
                    startIcon={busy === 'complete' ? <Spinner /> : <CheckIcon />}
                    onClick={complete}
                    disabled={!!busy}
                    className={`${styles.action} ${styles.complete}`}
                >
                    Complete
                </Button>
            )}
            <Tooltip title="Close window">
                <IconButton size="small" onClick={close} className={styles.closeBtn}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </div>
    );
}
