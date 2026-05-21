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
import {useTranslation} from 'react-i18next';
import Axios from "axios";
import api, {spaUrl} from '../api';
import {resolveError} from '../../i18n/resolveError';
import {useGet} from '@microprojects/edm-components/hooks';
import {dateToHumanSpan, utcDateToLocal} from '@microprojects/edm-components/utils';
import {useToast} from "@microprojects/edm-components/components";
import styles from './Operations.module.scss';

// HANDOFF · v2 PAT-04 (dashboard) × PAT-02 (dispatch ticket) — operations
// rendered as v2 tickets: surface card with a 3 px signal-tinted left
// rail, mono eyebrow ID, status badge top-right, process name title,
// optional location line, single-line foot with the latest timestamp.

const STATE_KEY = {
    Idle: 'idle',
    Scheduled: 'scheduled',
    InProgress: 'running',
    Completed: 'completed',
    Cancelled: 'cancelled',
    Faulted: 'faulted',
};

const STATE_TO_VISUAL = {
    Idle:       {rail: 'warn',   badge: 'warn'},
    Scheduled:  {rail: 'queued', badge: 'queued'},
    InProgress: {rail: 'run',    badge: 'run'},
    Completed:  {rail: 'done',   badge: 'idle'},
    Cancelled:  {rail: 'done',   badge: 'idle'},
    Faulted:    {rail: 'fault',  badge: 'fault'},
};

const EMPTY_ICON_BY_PERIOD = {
    running: RunningEmptyIcon,
    today:   TodayEmptyIcon,
    week:    WeekEmptyIcon,
};

const Operations = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {when} = useParams();
    const period = when ?? 'running';
    const { t } = useTranslation('tech');
    /* When `when` is in the URL, strip it; otherwise the pathname is
       already the base. Earlier the ternary was collapsed into a single
       `.replace('/${when ?? ""}', '')` which silently turned into
       `replace('/', '')` and chopped the leading slash off the URL. */
    const basePath = when
        ? location.pathname.replace(`/${when}`, '')
        : location.pathname.replace(/\/$/, '');

    const periods = [
        {value: 'running', label: t('operations.periods.running')},
        {value: 'today',   label: t('operations.periods.today')},
        {value: 'week',    label: t('operations.periods.week')},
    ];

    return (
        <Box>
            <Box className={styles.toolbar}>
                <nav className={styles.periodTabs}>
                    {periods.map(p => (
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
                    {t('operations.autoRefresh')}
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
    const { t } = useTranslation('tech');

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    const completeOperation = () => {
        Axios.post(`${api.operations}/${menu.id}/complete`)
            .then(() => {
                toast.success(t('operations.toasts.completed'));
                setTime(Date.now());
            })
            .catch((error) => toast.error(resolveError(error, t('operations.toasts.failedComplete'))))
            .finally(() => setMenu(null));
    };
    const copyOperation = () => {
        Axios.post(`${api.operations}/${menu.id}`)
            .then((response) => {
                window.open(spaUrl(`/operations/${response.data.id}`), '_blank');
            })
            .catch((error) => toast.error(resolveError(error, t('operations.toasts.failedCopy'))))
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
        const EmptyIcon = EMPTY_ICON_BY_PERIOD[period] || EMPTY_ICON_BY_PERIOD.running;
        const titleKey = `operations.empty.${period in EMPTY_ICON_BY_PERIOD ? period : 'running'}.title`;
        const helpKey = `operations.empty.${period in EMPTY_ICON_BY_PERIOD ? period : 'running'}.help`;
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                    <EmptyIcon />
                </div>
                <div className={styles.emptyTitle}>{t(titleKey)}</div>
                <div className={styles.emptyHelp}>{t(helpKey)}</div>
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
                {period === 'running' && <MenuItem onClick={completeOperation}>{t('operations.complete')}</MenuItem>}
                <MenuItem onClick={copyOperation}>{t('operations.copy')}</MenuItem>
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
    const { t } = useTranslation('tech');
    const stateKey = STATE_KEY[operation.state] || 'idle';
    const open = () => window.open(spaUrl(`/operations/${operation.id}`), '_blank');

    // Pick the latest meaningful timestamp; the others are reachable via
    // the operation page itself.
    const foot = useMemo(() => {
        if (operation.completed) return {label: t('operations.timeline.completed'), value: dateToHumanSpan(utcDateToLocal(operation.completed))};
        if (operation.cancelled) return {label: t('operations.timeline.cancelled'), value: dateToHumanSpan(utcDateToLocal(operation.cancelled))};
        if (operation.started)   return {label: t('operations.timeline.started'),   value: dateToHumanSpan(utcDateToLocal(operation.started))};
        if (operation.scheduled) return {label: t('operations.timeline.scheduled'), value: dateToHumanSpan(utcDateToLocal(operation.scheduled))};
        if (operation.created)   return {label: t('operations.timeline.created'),   value: dateToHumanSpan(utcDateToLocal(operation.created))};
        return null;
    }, [operation, t]);

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
                        {t(`operations.states.${stateKey}`)}
                    </span>
                </span>
                <IconButton
                    size="small"
                    className={styles.opCardMore}
                    onClick={onMore}
                    aria-label={t('operations.actions')}
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
