import React, {useEffect, useMemo, useState} from 'react';
import {Box, IconButton, Menu, MenuItem, Skeleton} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    PlayCircleOutline as RunningEmptyIcon,
    EventAvailable as TodayEmptyIcon,
    DateRange as WeekEmptyIcon,
    PlaceOutlined as LocationIcon,
    AutorenewOutlined as RefreshIcon,
} from '@mui/icons-material';
import {useParams, useLocation, useNavigate} from "react-router-dom";
import Axios from "axios";
import api, {spaUrl} from '../api';
import {useGet} from '@microprojects/edm-components/hooks';
import {dateToHumanSpan, utcDateToLocal} from '@microprojects/edm-components/utils';
import {useToast} from "@microprojects/edm-components/components";
import styles from './Operations.module.scss';

// HANDOFF · v2 PAT-04 (dashboard) × PAT-02 (dispatch ticket) — operations
// rendered as v2 tickets: surface card with a 3 px signal-tinted left
// rail, mono eyebrow ID, status badge top-right, process name title,
// optional location line, single-line foot with the latest timestamp.

const PERIODS = [
    {value: 'running', label: 'Running'},
    {value: 'today',   label: 'Today'},
    {value: 'week',    label: 'Week'},
];

const STATE_TO_VISUAL = {
    Idle:       {rail: 'warn',   badge: 'warn',   label: 'Idle'},
    Scheduled:  {rail: 'queued', badge: 'queued', label: 'Scheduled'},
    InProgress: {rail: 'run',    badge: 'run',    label: 'Running'},
    Completed:  {rail: 'done',   badge: 'idle',   label: 'Completed'},
    Cancelled:  {rail: 'done',   badge: 'idle',   label: 'Cancelled'},
    Faulted:    {rail: 'fault',  badge: 'fault',  label: 'Faulted'},
};

const EMPTY_BY_PERIOD = {
    running: {
        Icon: RunningEmptyIcon,
        title: 'No operation is running',
        help: 'Start a new operation from a workbench, or pick a different period to view past runs.',
    },
    today: {
        Icon: TodayEmptyIcon,
        title: 'No operations today',
        help: 'Nothing has been completed yet today. Check the Week tab for the wider history.',
    },
    week: {
        Icon: WeekEmptyIcon,
        title: 'Nothing in the last 7 days',
        help: 'No operations completed in the past week. Try Running for what is currently in flight.',
    },
};

const Operations = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {when} = useParams();
    const period = when ?? 'running';
    /* When `when` is in the URL, strip it; otherwise the pathname is
       already the base. Earlier the ternary was collapsed into a single
       `.replace('/${when ?? ""}', '')` which silently turned into
       `replace('/', '')` and chopped the leading slash off the URL. */
    const basePath = when
        ? location.pathname.replace(`/${when}`, '')
        : location.pathname.replace(/\/$/, '');

    return (
        <Box>
            <Box className={styles.toolbar}>
                <nav className={styles.periodTabs}>
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            type="button"
                            className={`${styles.periodTab} ${period === p.value ? styles.active : ''}`}
                            onClick={() => navigate(`${basePath}/${p.value}`)}
                        >
                            {p.label}
                        </button>
                    ))}
                </nav>
                <span className={styles.refreshHint}>
                    <RefreshIcon fontSize="inherit" />
                    auto-refresh 10s
                </span>
            </Box>
            <OperationsWhen period={period}/>
        </Box>
    );
};

const OperationsWhen = ({period}) => {
    const [menu, setMenu] = useState(null);
    const [time, setTime] = useState();
    const [[operations]] = useGet(`${api.operations}/${period}`, [time, period], null, true);
    const toast = useToast();

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    const errorOf = (error, fallback) =>
        error.response?.data?.detail || error.response?.data?.title || error.message || fallback;

    const completeOperation = () => {
        Axios.post(`${api.operations}/${menu.id}/complete`)
            .then(() => {
                toast.success('Operation completed');
                setTime(Date.now());
            })
            .catch((error) => toast.error(errorOf(error, 'Failed to complete operation')))
            .finally(() => setMenu(null));
    };
    const copyOperation = () => {
        Axios.post(`${api.operations}/${menu.id}`)
            .then((response) => {
                window.open(spaUrl(`/operations/${response.data.id}`), '_blank');
            })
            .catch((error) => toast.error(errorOf(error, 'Failed to copy operation')))
            .finally(() => setMenu(null));
    };

    if (operations === null) {
        // Loading skeleton — same grid shape as the live cards so the
        // page doesn't reflow when data lands. v2 04c.3 loading surface.
        return (
            <div className={styles.cardGrid} aria-busy="true" aria-live="polite">
                {Array.from({length: 6}).map((_, i) => (
                    <OperationCardSkeleton key={i}/>
                ))}
            </div>
        );
    }

    if (operations && operations.length === 0) {
        const empty = EMPTY_BY_PERIOD[period] || EMPTY_BY_PERIOD.running;
        const EmptyIcon = empty.Icon;
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                    <EmptyIcon />
                </div>
                <div className={styles.emptyTitle}>{empty.title}</div>
                <div className={styles.emptyHelp}>{empty.help}</div>
            </div>
        );
    }

    return (
        <>
            {operations && (
                <div className={styles.cardGrid}>
                    {operations.map((o) => (
                        <OperationCard
                            key={o.id}
                            operation={o}
                            onMore={(ev) => {
                                ev.stopPropagation();
                                setMenu({target: ev.currentTarget, id: o.id});
                            }}
                        />
                    ))}
                </div>
            )}

            <Menu
                anchorEl={menu?.target}
                open={!!menu}
                onClose={() => setMenu(null)}
                disableScrollLock
                transformOrigin={{horizontal: 'right', vertical: 'top'}}
                anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
            >
                {period === 'running' && <MenuItem onClick={completeOperation}>Complete</MenuItem>}
                <MenuItem onClick={copyOperation}>Copy</MenuItem>
            </Menu>
        </>
    );
};

function OperationCardSkeleton() {
    return (
        <article className={`${styles.opCard} ${styles.skeleton}`} aria-hidden="true">
            <header className={styles.opCardHead}>
                <Skeleton variant="text" width={48} sx={{ fontSize: 11 }} />
                <span className={styles.opCardBadgeWrap}>
                    <Skeleton variant="rounded" width={72} height={22} />
                </span>
                <Skeleton variant="circular" width={28} height={28} />
            </header>

            <div className={styles.opCardBody}>
                <Skeleton variant="text" width="80%" sx={{ fontSize: 14 }} />
                <Skeleton variant="text" width="50%" sx={{ fontSize: 11 }} />
            </div>

            <footer className={styles.opCardFoot}>
                <Skeleton variant="text" width={120} sx={{ fontSize: 11 }} />
            </footer>
        </article>
    );
}

function OperationCard({operation, onMore}) {
    const visual = STATE_TO_VISUAL[operation.state] || STATE_TO_VISUAL.Idle;
    const open = () => window.open(spaUrl(`/operations/${operation.id}`), '_blank');

    // Pick the latest meaningful timestamp; the others are reachable via
    // the operation page itself.
    const foot = useMemo(() => {
        if (operation.completed) return {label: 'Completed', value: dateToHumanSpan(utcDateToLocal(operation.completed))};
        if (operation.cancelled) return {label: 'Cancelled', value: dateToHumanSpan(utcDateToLocal(operation.cancelled))};
        if (operation.started)   return {label: 'Started',   value: dateToHumanSpan(utcDateToLocal(operation.started))};
        if (operation.scheduled) return {label: 'Scheduled', value: dateToHumanSpan(utcDateToLocal(operation.scheduled))};
        if (operation.created)   return {label: 'Created',   value: dateToHumanSpan(utcDateToLocal(operation.created))};
        return null;
    }, [operation]);

    return (
        <article
            className={`${styles.opCard} ${styles[visual.rail]}`}
            onClick={open}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            }}
            role="button"
            tabIndex={0}
        >
            <header className={styles.opCardHead}>
                <span className={styles.opCardId}>#{operation.id}</span>
                <span className={styles.opCardBadgeWrap}>
                    <span className={`badge ${visual.badge}`}>
                        <span className="dot" />
                        {visual.label}
                    </span>
                </span>
                <IconButton
                    size="small"
                    className={styles.opCardMore}
                    onClick={onMore}
                    aria-label="Operation actions"
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </header>

            <div className={styles.opCardBody}>
                <div className={styles.opCardTitle} title={operation.processName}>
                    {operation.processName}
                </div>
                {operation.workplaceName && (
                    <div className={styles.opCardLocation} title={operation.workplaceName}>
                        <LocationIcon fontSize="inherit" />
                        {operation.workplaceName}
                    </div>
                )}
            </div>

            {foot && (
                <footer className={styles.opCardFoot}>
                    <span className={styles.footLabel}>{foot.label}</span>
                    <span className={styles.footValue}>{foot.value}</span>
                </footer>
            )}
        </article>
    );
}

export default Operations;
