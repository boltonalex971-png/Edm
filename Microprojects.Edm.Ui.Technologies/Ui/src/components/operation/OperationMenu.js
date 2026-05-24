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
import {useTranslation} from 'react-i18next';
import {useDialog} from "@microprojects/edm-components/hooks";
import {useSignalR} from "@microprojects/edm-components/hooks";
import api, {spaUrl} from "../api.js";
import {resolveError} from '../../i18n/resolveError';
import {useToast} from "@microprojects/edm-components/components";
import {displayUserName} from "@microprojects/edm-components/utils";
import styles from './OperationLayout.module.scss';

// Spinner sized to fit the action button's startIcon slot. While an
// action is in flight the icon is swapped for this spinner so the
// operator sees "I'm working on it" and not just a dead disabled button.
const Spinner = () => <CircularProgress size={16} thickness={5} sx={{ color: 'currentColor' }} />;

// HANDOFF · v2 PAT-03 · operator workstation chrome. Single-row layout:
// collapse · #code · process name · home/gear · spacer · status badge ·
// clock · timeline · action buttons · close. Everything aligns on a
// 38 px baseline — no stacked rows, no AppBar/Toolbar chrome.

const STATE_TO_BADGE_KIND = {
    Idle:       'idle',
    Scheduled:  'queued',
    InProgress: 'run',
    Completed:  'idle',
    Cancelled:  'idle',
    Faulted:    'fault',
};

const STATE_KEY = {
    Idle: 'idle',
    Scheduled: 'scheduled',
    InProgress: 'running',
    Completed: 'completed',
    Cancelled: 'cancelled',
    Faulted: 'faulted',
};

const STATE_TIMELINE_KEY = {
    Idle:       'startAt',
    Scheduled:  'willStartAt',
    InProgress: 'started',
    Completed:  'completed',
    Cancelled:  'cancelled',
    Faulted:    'checked',
};

export function OperationMenu({operation, to, onCollapse, collapsed}) {
    const operatorFull = useSelector(s => s.user?.name);
    const operatorShort = displayUserName(operatorFull);
    const {t} = useTranslation('tech');

    return (
        <header className={styles.menu} data-collapsed={collapsed ? 'true' : 'false'}>
            <div className={styles.identity}>
                {/*<span className={styles.opCode}>#{operation.id}</span>*/}
                <span className={styles.opSep}>·</span>
                <span className={styles.processName} title={operation.process.name}>
                    {operation.process.name}
                </span>
                {operatorShort && (
                    <>
                        <span className={styles.opSep}>·</span>
                        <span className={styles.operatorName} title={t('operation.operator', {name: operatorFull})}>
                            {operatorShort}
                        </span>
                    </>
                )}
            </div>

            <div className={styles.navGroup}>
                <Tooltip title={t('operation.home')}>
                    <IconButton size="small" className={styles.navBtn} onClick={() => to('')}>
                        <HomeIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('operation.configuration')}>
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
                title={t('operation.hideToolbar')}
                aria-label={t('operation.hideToolbar')}
            >
                <CollapseIcon fontSize="small" />
            </button>
        </header>
    );
}

function Clock() {
    const [now, setNow] = useState(new Date());
    const {i18n} = useTranslation('tech');
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-GB';

    return (
        <span className={styles.clock}>
            {now.toLocaleString(locale, {
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
    const {t, i18n} = useTranslation('tech');

    useSignalR(`${api.baseUrl}/hub`, `Operation-${operation.id}-lifecycle`, (message) => {
        setStatus(message);
        setBusy(null);
    });

    const copy = () => {
        setBusy('copy');
        Axios.post(`${api.operations}/${operation.id}`)
            .then((response) => {
                window.open(spaUrl(`/operations/${response.data.id}`), '_self');
            })
            .catch((error) => {
                setBusy(null);
                toast.error(resolveError(error, t('operations.toasts.failedCopy')));
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
                toast.error(resolveError(error, t('operations.toasts.failedStart')));
            });
    };

    const stop = () => warning({
        title: t('operation.stopTitle'),
        message: t('operation.stopMessage'),
        actionLabel: t('operation.stopAction'),
        onConfirm: () => {
            setBusy('stop');
            Axios.post(`${api.operations}/${operation.id}/stop`)
                .catch((error) => {
                    setBusy(null);
                    toast.error(resolveError(error, t('operations.toasts.failedStop')));
                });
        }
    });

    const complete = () => confirm({
        title: t('operation.completeTitle'),
        message: t('operation.completeMessage'),
        actionLabel: t('operation.completeAction'),
        onConfirm: () => {
            setBusy('complete');
            Axios.post(`${api.operations}/${operation.id}/complete`)
                .catch((error) => {
                    setBusy(null);
                    toast.error(resolveError(error, t('operations.toasts.failedComplete')));
                });
        }
    });

    const close = () => window.close();

    const badgeKind = STATE_TO_BADGE_KIND[status.state] || 'idle';
    const stateKey = STATE_KEY[status.state];
    const stateLabel = stateKey ? t(`operations.states.${stateKey}`) : (status.state || '');
    const timelineKey = STATE_TIMELINE_KEY[status.state];
    const timelineLabel = timelineKey ? t(`operations.timeline.${timelineKey}`) : '';
    const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-GB';
    const timestamp = status.stateTimestamp ? new Date(status.stateTimestamp).toLocaleString(locale, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }) : '';

    return (
        <div className={styles.cluster}>
            {dialog}

            <Clock />

            <span className={`badge ${badgeKind}`}>
                <span className="dot" />
                {stateLabel}
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
                    {t('operation.start')}
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
                    {t('operation.stop')}
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
                    {t('operations.copy')}
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
                    {t('operation.completeAction')}
                </Button>
            )}
            <Tooltip title={t('operation.closeWindow')}>
                <IconButton size="small" onClick={close} className={styles.closeBtn}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </div>
    );
}
