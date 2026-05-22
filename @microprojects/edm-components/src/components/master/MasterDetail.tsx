import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {useNavigate, Routes, Route, useLocation} from 'react-router-dom';
import {Trans, useTranslation} from 'react-i18next';
import axios from 'axios';
import {useDialog} from '../../hooks/useDialog';
import {useAcquireEntityLock, useEntityLockState} from '../../hooks/entityLocks';
import {listTag, useOptionalInvalidateEntities} from '../../hooks/entityRefresh';
import {useStickyHeaderOffset} from '../../hooks/useStickyHeaderOffset';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    Grid as MuiGrid,
    Button as MuiButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Breadcrumbs,
    Link as MuiLink,
    Alert,
    Stack,
    Collapse,
    CircularProgress,
} from '@mui/material';
import {
    Edit as EditIcon,
    Visibility as ViewIcon,
    ContentCopy as CopyIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    NavigateNext as NavigateNextIcon,
    Folder as FolderIcon,
    InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import {SmartScroll, SmartScrollContent} from '@microprojects/tools';

import {TreeViewMaster, refresh, TreeViewMasterProps} from './TreeViewMaster';
import {TreeNode, getEntityType, DEFAULT_ENTITY_TYPE_MAP} from './treeUtils';
import {Loading} from '../states/Loading';
import {DetailStub} from '../states/EmptyState';
import {ErrorStub} from '../states/ErrorState';
import {useToast} from '../states/Toast';
import styles from './Detail.module.scss';

// MUI v7's typed Grid drops the legacy `item`/`xs`/`md` props (still accepted
// at runtime). Cast to keep call sites compiling without a v2 migration.
const Grid: any = MuiGrid;

// MUI v7's Link rejects `href` when `component="span"`; cast to keep the
// breadcrumb crumb-as-span pattern compiling. Behavior unchanged.
const Link: any = MuiLink;

/* HANDOFF · imperative-handle pattern preserved verbatim from Tech.
   `_selectedItem` lets Editor read the active tree node on save (parentId).
   `_render`/`_renderFunc` lets reloadMaster() force a Detail re-render.
   Refactor candidate for Phase 2 (move to context-based ref). */
let _selectedItem: TreeNode | null = null;
let _render = 0;
let _renderFunc: ((next: number) => void) | undefined;

/** Lets a nested Editor flip its parent Detail out of edit mode after a
 *  successful save. Detail provides the setter; Editor consumes it. Lifted
 *  from Logistics — opt-in: if no Detail is mounted above the Editor, the
 *  consumer just gets `undefined` and skips the flip. */
export const DetailEditModeContext = createContext<((editMode: boolean) => void) | undefined>(undefined);

/** "Empty" id sentinel for new (not-yet-persisted) entities. Tech uses 0,
 *  Logistics uses this UUID. Both are recognised as "new" when computing
 *  initial edit mode and skipping the cross-user lock acquire. */
export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

export function reloadMaster() {
    refresh();
    if (_renderFunc) _renderFunc(++_render);
}

export interface MasterDetailProps {
    /** Data API root passed to TreeViewMaster (e.g. `/api/processes`). */
    api: string;
    /** Mount path of this MasterDetail (e.g. `/config/workplaces`). The
     *  consumer's parent Route should be declared with `path="<this>/*"`
     *  so nested folder/leaf routes resolve. Used to generate "back to root"
     *  navigation and the folder-route base in `folderComponent`. */
    path: string;
    /** Hierarchies API root for folder moves + folder edits (e.g. `/api/hierarchies`). */
    hierarchiesApi?: string;
    /** Detail element rendered for a leaf route. */
    detail?: React.ReactElement;
    /** Folder editor component rendered for folder routes. Omit to skip the folder route.
     *  Receives `entityType` derived from the API URL (capitalized — e.g. `"Workplace"`,
     *  `"Process"`) so the folder POST body can target the right hierarchy bucket. */
    folderComponent?: React.ComponentType<{api?: string; path: string; entityType?: string; onChange: () => void; onClose: () => void}>;
    /** Help message for the empty / no-selection stub. */
    stubMessage?: string;
    /** Override TreeViewMaster's entity-type detection. */
    entityTypeMap?: TreeViewMasterProps['entityTypeMap'];
    /** Override TreeViewMaster's icon map. */
    iconMap?: TreeViewMasterProps['iconMap'];
    /** Allow the user to drag the divider between master and detail panes.
     *  Default: true. Set to false for layouts that should keep a fixed split. */
    resizable?: boolean;
    /** Forwarded to TreeViewMaster — external refetch signal (e.g. from `useEntityToken`). */
    refreshToken?: unknown;
    /** Forwarded to TreeViewMaster — fires with the first raw API node when loaded. */
    onRootLoaded?: (rootNode: any) => void;
    /** Forwarded to TreeViewMaster — extra query-string params on the hierarchy GET. */
    getHierarchyQuery?: () => Record<string, string | undefined>;
    /** Forwarded to TreeViewMaster — hidden-root unwrap for Logistics-style trees. */
    unwrapSingleRoot?: boolean;
    /** Explicit entity type override — bypasses URL-prefix detection. Use when one
     *  URL hosts multiple kinds (e.g. Logistics's `/processes` for manufacturing /
     *  technology / operation). Forwarded to TreeViewMaster. */
    entityType?: string;
    /** URL segment used as the "new (unsaved) item" sentinel by the Add Folder /
     *  Add Item buttons and the empty-state Add action. Default is the empty
     *  Guid since every consumer is Guid-keyed after the Tech directory
     *  unification. Forwarded to TreeViewMaster. */
    newId?: string;
}

const SEPARATOR_MIN_PX = 80;

export function MasterDetail(props: MasterDetailProps) {
    const navigate = useNavigate();
    const {path, resizable = true, newId = EMPTY_GUID} = props;
    const dynamicOffset = useStickyHeaderOffset();
    const FolderComponent = props.folderComponent;
    // Capitalize the URL-derived entity type so it matches backend HierarchyType enum
    // values (Workplace/Process/Host/Device). FolderComponent uses this when POSTing
    // a new folder so the backend knows which typed-hierarchy bucket to put it in.
    const entityTypeLower = getEntityType(props.api, props.entityTypeMap || DEFAULT_ENTITY_TYPE_MAP);
    const folderEntityType = entityTypeLower
        ? entityTypeLower.charAt(0).toUpperCase() + entityTypeLower.slice(1)
        : undefined;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [masterPx, setMasterPx] = useState<number | null>(null);
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');

    // Re-clamp the manual master width on viewport changes so the master
    // pane never exceeds 1/3 of the new container width.
    useEffect(() => {
        const el = containerRef.current;
        if (!el || mode !== 'manual') return;
        const reclamp = () => {
            const cap = Math.floor(el.getBoundingClientRect().width / 3);
            setMasterPx((prev) =>
                prev != null && prev > cap ? Math.max(SEPARATOR_MIN_PX, cap) : prev,
            );
        };
        const ro = new ResizeObserver(reclamp);
        ro.observe(el);
        return () => ro.disconnect();
    }, [mode]);

    const onSeparatorDrag = useCallback((clientX: number) => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cap = Math.floor(rect.width / 3);
        const next = Math.max(
            SEPARATOR_MIN_PX,
            Math.min(cap, Math.round(clientX - rect.left)),
        );
        setMasterPx(next);
        setMode('manual');
    }, []);

    const masterStyle: React.CSSProperties = resizable
        ? mode === 'manual' && masterPx != null
            ? {flex: `0 0 ${masterPx}px`, maxWidth: '33.333%', minWidth: 0, overflow: 'hidden'}
            : {flex: '0 0 auto', maxWidth: '33.333%', minWidth: '280px', overflow: 'hidden'}
        : {flex: 1, minWidth: '280px'};

    const detailStyle: React.CSSProperties = resizable
        ? {flex: 1, minWidth: 0, overflow: 'hidden'}
        : {flex: '5 1 0%', minWidth: 0, width: 0, overflow: 'hidden'};

    return (
        <Box ref={containerRef as any} sx={{width: '100%', minWidth: 0}}>
            <SmartScroll
                offsetTop={dynamicOffset}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: resizable ? 0 : 12,
                    width: '100%',
                    minWidth: 0,
                }}
            >
                <SmartScrollContent style={masterStyle}>
                    <TreeViewMaster
                        api={props.api}
                        hierarchiesApi={props.hierarchiesApi}
                        onCurrentRootChanged={(root: TreeNode) => { _selectedItem = root; }}
                        entityTypeMap={props.entityTypeMap}
                        iconMap={props.iconMap}
                        refreshToken={props.refreshToken}
                        onRootLoaded={props.onRootLoaded}
                        getHierarchyQuery={props.getHierarchyQuery}
                        unwrapSingleRoot={props.unwrapSingleRoot}
                        entityType={props.entityType}
                        newId={newId}
                    />
                </SmartScrollContent>
                {resizable && <PaneSeparator onDrag={onSeparatorDrag} />}
                <SmartScrollContent style={detailStyle}>
                    <Routes>
                        <Route
                            index
                            element={
                                <DetailStub
                                    message={props.stubMessage}
                                    onAdd={() => navigate(`${path}/${newId}`)}
                                />
                            }
                        />

                        {FolderComponent && (
                            <Route
                                path="folder/:id"
                                element={
                                    <FolderComponent
                                        api={props.hierarchiesApi}
                                        path={path}
                                        entityType={folderEntityType}
                                        onChange={() => reloadMaster()}
                                        onClose={() => navigate(path)}
                                    />
                                }
                            />
                        )}
                        <Route path=":id" element={props.detail} />
                    </Routes>
                </SmartScrollContent>
            </SmartScroll>
        </Box>
    );
}

type PaneSeparatorProps = {
    onDrag: (clientX: number) => void;
};

const PaneSeparator = ({onDrag}: PaneSeparatorProps) => {
    // While dragging we render a small vertical guide segment centered on the cursor.
    // `null` while idle keeps the indicator out of the DOM so the separator stays invisible at rest.
    const [guide, setGuide] = useState<{x: number; y: number} | null>(null);

    const update = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        setGuide({x: rect.left + rect.width / 2, y: e.clientY});
        onDrag(e.clientX);
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        update(e);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!guide) return;
        update(e);
    };

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!guide) return;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
        setGuide(null);
    };

    const GUIDE_HALF = 110;

    return (
        <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            role="separator"
            aria-orientation="vertical"
            style={{
                flex: '0 0 16px',
                alignSelf: 'stretch',
                cursor: 'col-resize',
                touchAction: 'none',
                background: 'transparent',
                minHeight: '60vh',
            }}
        >
            {guide && (
                <div
                    style={{
                        position: 'fixed',
                        left: guide.x,
                        top: guide.y - GUIDE_HALF,
                        width: 2,
                        height: GUIDE_HALF * 2,
                        transform: 'translateX(-50%)',
                        background:
                            'linear-gradient(to bottom, rgba(120, 144, 156, 0) 0%, rgba(120, 144, 156, 0.7) 50%, rgba(120, 144, 156, 0) 100%)',
                        borderRadius: 1,
                        pointerEvents: 'none',
                        zIndex: 1000,
                    }}
                />
            )}
        </div>
    );
};

const pluralize = (type?: string): string => {
    if (!type) return 'Items';
    const name = type.charAt(0).toUpperCase() + type.slice(1);
    if (name.endsWith('s') || name.endsWith('x') || name.endsWith('ch') || name.endsWith('sh')) {
        return name + 'es';
    }
    if (/[^aeiou]y$/i.test(name)) {
        return name.slice(0, -1) + 'ies';
    }
    return name + 's';
};

const scrollToRef = (ref: React.RefObject<HTMLElement> | null | undefined) => {
    if (ref && ref.current) {
        const header = ref.current.querySelector(`[data-card-header="true"]`);
        const target = header || ref.current;
        const rect = target.getBoundingClientRect();

        const stickyHeaders = document.querySelectorAll('[data-sticky-header="true"]');
        let maxBottom = 0;
        stickyHeaders.forEach((h) => {
            const hRect = h.getBoundingClientRect();
            maxBottom = Math.max(maxBottom, hRect.bottom);
        });

        window.scrollTo({
            top: window.scrollY + rect.top - maxBottom - 10,
            behavior: 'smooth',
        });
    }
};

export interface DetailParent {
    name?: string;
    icon?: React.ReactElement;
    ref?: React.RefObject<HTMLElement>;
}

export interface DetailProps {
    card?: React.ReactNode;
    icon?: React.ReactElement;
    editor?: React.ReactNode;
    relations?: React.ReactNode;
    subDetail?: React.ReactElement;
    id?: any;
    loading?: any;
    error?: any;
    validation?: string;
    data?: any;
    onChange?: (data?: any) => void;
    onClose?: () => void;
    onUp?: () => void;
    path?: string;
    api?: string;
    editable?: boolean;
    copyable?: boolean;
    deletable?: boolean;
    type?: string;
    parents?: DetailParent[];
    /** Optional top-right slot in the Detail header grid. */
    status?: React.ReactNode;
    /** Current user — required to acquire a cross-user edit lock. When omitted
     *  the lock is not acquired (Tech consumers can leave it blank). */
    username?: string;
    /** Treat this record as outdated (auto-forked / superseded). Disables the
     *  edit + copy actions and shows an "outdated" badge next to the title.
     *  When omitted, falls back to `data.outdated`. */
    outdated?: boolean;
    /** Initial edit mode. Falls back to true when `id === 0` or `id === EMPTY_GUID`
     *  (a fresh, unsaved record). */
    editMode?: boolean;
    /** Hide the edit / copy / delete actions entirely. Use for screens that
     *  embed Detail in a read-only context (e.g. Logistics's SupplyDetail when
     *  shown as a sub-detail). */
    readonly?: boolean;
    /** Override the title shown in the header (default: `data.name`). Used
     *  for placeholder titles like "New Order" before the record exists. */
    title?: string;
    /** Override the description shown in the header (default: `data.description`). */
    subTitle?: string;
    /** Visual entity-color override for the header icon — bypasses the `type`-derived
     *  CSS variable lookup. Use when one `type` hosts multiple visual kinds (e.g.
     *  Logistics's three process kinds keep `type='process'` for locks/refresh but
     *  need distinct icon hues). Lock and refresh still use `type`. */
    entityType?: string;
}

export function Detail(props: DetailProps) {
    const navigate = useNavigate();
    const toast = useToast();
    const {t} = useTranslation('edm-master');
    const invalidate = useOptionalInvalidateEntities();
    const subDetailRef = React.useRef<HTMLDivElement | null>(null);
    const detailContainerRef = React.useRef<HTMLDivElement | null>(null);
    const [bufferedSubDetail, setBufferedSubDetail] = useState<React.ReactElement | undefined>(props.subDetail);

    // Main detail transition states
    const [displayProps, setDisplayProps] = useState<DetailProps>(props);
    const [isMainFading, setIsMainFading] = useState(false);

    const [isFading, setIsFading] = useState(false);
    const [lockHeight, setLockHeight] = useState(0);
    const [, setRefresh] = useState(0);
    _renderFunc = setRefresh;
    let [editMode, setEditMode] = useState(props.editMode ?? false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const isNewItem = props.id === 0 || props.id === EMPTY_GUID;
    editMode = editMode || isNewItem;

    // Cross-user edit lock — opt-in. Only effective when LockProvider is
    // mounted (Logistics) AND props.type / props.id / props.username are
    // present; otherwise the hooks return NO_LOCK and the acquire effect
    // skips. Tech doesn't mount LockProvider so all of this is inert there.
    const lockableId = props.id && !isNewItem ? String(props.id) : undefined;
    useAcquireEntityLock(props.type, lockableId, editMode, props.username || '');
    const remoteLock = useEntityLockState(props.type, lockableId);
    const lockedByOther = !!remoteLock.lockedBy && !remoteLock.isOwn;
    const outdated = props.outdated ?? !!props.data?.outdated;

    // Force out of edit mode if another client took the lock first (race when
    // both users press Edit nearly simultaneously and the remote message
    // arrives after our own local flip).
    React.useEffect(() => {
        if (lockedByOther && editMode && props.id && !isNewItem) {
            setEditMode(false);
        }
    }, [lockedByOther, editMode, props.id, isNewItem]);

    // Handle main detail transitions
    React.useLayoutEffect(() => {
        const isLoadingChanged = props.loading !== displayProps.loading;
        const isIdChanged = props.id !== displayProps.id;

        if (isLoadingChanged || isIdChanged) {
            if (detailContainerRef.current) {
                setLockHeight(detailContainerRef.current.offsetHeight);
            }

            setIsMainFading(true);
            const timer = setTimeout(() => {
                setDisplayProps(props);
                setIsMainFading(false);
                setTimeout(() => setLockHeight(0), 300);
            }, 200);
            return () => clearTimeout(timer);
        } else {
            setDisplayProps(props);
        }
    }, [props, displayProps.loading, displayProps.id]);

    // Handle buffered subdetail transitions with height locking
    React.useLayoutEffect(() => {
        if (props.subDetail !== bufferedSubDetail) {
            if (detailContainerRef.current) {
                setLockHeight(detailContainerRef.current.offsetHeight);
            }

            setIsFading(true);
            const timer = setTimeout(() => {
                setBufferedSubDetail(props.subDetail);
                setIsFading(false);
                setTimeout(() => setLockHeight(0), 300);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [props.subDetail, bufferedSubDetail]);

    React.useEffect(() => {
        if (bufferedSubDetail && subDetailRef.current && !isFading) {
            const timer = setTimeout(() => {
                if (!subDetailRef.current) return;
                const rect = subDetailRef.current.getBoundingClientRect();
                const stickyHeaders = document.querySelectorAll('[data-sticky-header="true"]');
                let maxBottom = 0;
                stickyHeaders.forEach((header) => {
                    maxBottom = Math.max(maxBottom, header.getBoundingClientRect().bottom);
                });

                if (rect.top < maxBottom || rect.top > window.innerHeight - 100) {
                    window.scrollTo({
                        top: window.scrollY + rect.top - maxBottom - 10,
                        behavior: 'smooth',
                    });
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [bufferedSubDetail, isFading]);

    const handleDelete = () => {
        setDeleteDialogOpen(false);
        axios.delete(`${props.api}/${props.data?.id}`)
            .then(() => {
                toast.success(t('toast.deleted', '{{name}} deleted', {
                    name: props.data?.name || t('toast.fallbackName', 'Item'),
                }));
                props.onChange && props.onChange();
                if (props.type) {
                    invalidate([
                        {type: props.type},
                        {type: props.type, id: props.data?.id},
                        listTag(props.type),
                    ]);
                }
                if (props.path) navigate(props.path);
                props.onClose && props.onClose();
            })
            .catch((err: any) => toast.error(err.response?.data?.detail || err.message || t('error.deleteFailed', 'Delete failed')));
    };

    if (props.error) {
        return (
            <Box className={styles.detailContainer}>
                <ErrorStub
                    error={props.error}
                    onBack={() => props.path && navigate(props.path)}
                />
            </Box>
        );
    }

    return (
        <DetailEditModeContext.Provider value={setEditMode}>
        <Stack spacing={2} ref={detailContainerRef as any} sx={{minHeight: lockHeight > 0 ? `${lockHeight}px` : 'auto', width: '100%', minWidth: 0, position: 'relative'}}>
            <Box className={styles.detailContainer} sx={{width: '100%', minWidth: 0, position: 'relative'}}>
                {isMainFading && (
                    <Box className={styles.loadingOverlay}>
                        <Box className={styles.stickyIndicator}>
                            <CircularProgress size={32} />
                        </Box>
                    </Box>
                )}
                <Box sx={{
                    width: '100%',
                    minWidth: 0,
                    opacity: isMainFading ? 0.4 : 1,
                    filter: isMainFading ? 'grayscale(0.5)' : 'none',
                    transition: 'all 0.2s',
                }}>
                    {(displayProps.loading && displayProps.id) ? (
                        <Loading />
                    ) : (
                        <>
                            <Box
                                data-card-header="true"
                                className={styles.stickyHeader}
                            >
                                {(() => {
                                    const colorKey = displayProps.entityType ?? displayProps.type;
                                    return (
                                        <Box
                                            className={`${styles.iconWrapper} ${colorKey ? (styles as any)[colorKey] || '' : ''}`}
                                            style={colorKey ? {
                                                background: `var(--ent-${colorKey}-soft, var(--surface-2))`,
                                                color: `var(--ent-${colorKey}-deep, var(--ink-2))`,
                                            } : undefined}
                                        >
                                            {displayProps.icon || (displayProps.type === 'folder' ? <FolderIcon /> : <FileIcon />)}
                                        </Box>
                                    );
                                })()}

                                <Breadcrumbs
                                    separator={<NavigateNextIcon fontSize="inherit" />}
                                    aria-label="breadcrumb"
                                    className={styles.breadcrumbs}
                                >
                                    {displayProps.parents && displayProps.parents.map((p, idx) => (
                                        <Link
                                            key={idx}
                                            variant="caption"
                                            underline="hover"
                                            color="inherit"
                                            href="#"
                                            component="span"
                                            onClick={(e: React.MouseEvent) => { e.preventDefault(); scrollToRef(p.ref); }}
                                            sx={{display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer'}}
                                        >
                                            {p.icon && React.cloneElement(p.icon, {sx: {fontSize: '12px !important'}} as any)}
                                            {p.name}
                                        </Link>
                                    ))}
                                    <Typography
                                        variant="caption"
                                        color="inherit"
                                        component="span"
                                        sx={{display: 'flex', alignItems: 'center', gap: 0.5}}
                                    >
                                        {displayProps.icon && React.cloneElement(displayProps.icon, {sx: {fontSize: '12px !important'}} as any)}
                                        {(() => {
                                            const k = displayProps.entityType || displayProps.type;
                                            return k ? t(`entityPlural.${k}`, pluralize(k)) : pluralize(k);
                                        })()}
                                    </Typography>
                                </Breadcrumbs>

                                <Box className={styles.dpName}>
                                    <Typography variant="h6" className={styles.title}>
                                        {displayProps.title || displayProps.data?.name || t('title.newItem', 'New Item')}
                                        {lockedByOther && (
                                            <Box
                                                component="span"
                                                sx={{ml: '0.6rem', fontSize: '0.75em', fontWeight: 'normal', color: '#b58900'}}
                                            >
                                                {t('badge.lockedBy', '🔒 Locked by {{name}}', {name: remoteLock.lockedBy})}
                                            </Box>
                                        )}
                                        {outdated && (
                                            <Box
                                                component="span"
                                                title={t('badge.outdatedTooltip', 'A newer version exists. This record is preserved for historical references and cannot be edited.')}
                                                sx={{ml: '0.6rem', fontSize: '0.75em', fontWeight: 'normal', color: 'var(--ink-3)', fontStyle: 'italic'}}
                                            >
                                                {t('badge.outdated', 'outdated')}
                                            </Box>
                                        )}
                                    </Typography>
                                </Box>

                                {displayProps.status && (
                                    <Box className={styles.dpStatus}>{displayProps.status}</Box>
                                )}

                                {(displayProps.subTitle || displayProps.data?.description) && (
                                    <Typography variant="body2" className={styles.description}>
                                        {displayProps.subTitle || displayProps.data?.description}
                                    </Typography>
                                )}

                                <Box className={styles.actions}>
                                    {displayProps.editor && !displayProps.readonly && (
                                        <>
                                            {displayProps.editable !== false && (
                                            <Tooltip
                                                title={
                                                    outdated
                                                        ? t('action.outdatedEdit', 'Outdated — open the current version to edit')
                                                        : lockedByOther
                                                            ? t('action.lockedBy', 'Locked by {{name}}', {name: remoteLock.lockedBy})
                                                            : editMode
                                                                ? t('action.viewMode', 'View mode')
                                                                : t('action.editMode', 'Edit mode')
                                                }
                                            >
                                                <span>
                                                    <IconButton
                                                        className={styles.actionBtn}
                                                        onClick={() => setEditMode(!editMode)}
                                                        size="small"
                                                        disabled={lockedByOther || outdated}
                                                    >
                                                        {editMode ? <ViewIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            )}
                                            {displayProps.copyable !== false && (
                                            <Tooltip title={lockedByOther ? t('action.lockedBy', 'Locked by {{name}}', {name: remoteLock.lockedBy}) : t('action.copy', 'Copy')}>
                                                <span>
                                                    <IconButton
                                                        className={styles.actionBtn}
                                                        disabled={lockedByOther || outdated}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const newId = (displayProps.id === 0 || typeof displayProps.id === 'number') ? 0 : EMPTY_GUID;
                                                            const data = {...displayProps.data, id: newId, name: `${displayProps.data?.name} (Copy)`};
                                                            axios.post(`${displayProps.api}`, data)
                                                                .then((response) => {
                                                                    toast.success(t('toast.copied', 'Copied'));
                                                                    displayProps.onChange && displayProps.onChange(response.data);
                                                                    if (displayProps.type) {
                                                                        invalidate([
                                                                            {type: displayProps.type},
                                                                            {type: displayProps.type, id: response.data.id},
                                                                            listTag(displayProps.type),
                                                                        ]);
                                                                    }
                                                                    if (displayProps.path) navigate(`${displayProps.path}/${response.data.id}`);
                                                                })
                                                                .catch((err: any) => toast.error(err.response?.data?.detail || err.message || t('toast.copyFailed', 'Copy failed')));
                                                        }}
                                                        size="small"
                                                    >
                                                        <CopyIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            )}
                                            {displayProps.deletable !== false && (
                                            <Tooltip title={lockedByOther ? t('action.lockedBy', 'Locked by {{name}}', {name: remoteLock.lockedBy}) : t('action.delete', 'Delete')}>
                                                <span>
                                                    <IconButton
                                                        className={`${styles.actionBtn} ${styles.delete}`}
                                                        onClick={() => setDeleteDialogOpen(true)}
                                                        size="small"
                                                        disabled={lockedByOther}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            )}
                                        </>
                                    )}
                                    {displayProps.onClose && (
                                        <Tooltip title={t('action.close', 'Close')}>
                                            <IconButton className={styles.actionBtn} onClick={displayProps.onClose} size="small">
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>

                            <Box className={styles.contentBody}>
                                <Stack spacing={4}>
                                    {displayProps.validation && (
                                        <Alert color='warning'>{displayProps.validation}</Alert>
                                    )}

                                    {editMode && displayProps.editor && (
                                        <Box className={styles.muiFormWrapper}>
                                            {displayProps.editor}
                                        </Box>
                                    )}

                                    {!editMode && displayProps.card && (
                                        <Box>{displayProps.card}</Box>
                                    )}

                                    {!editMode && displayProps.relations && (
                                        <Box>
                                            {React.isValidElement(displayProps.relations)
                                                ? React.cloneElement(displayProps.relations as React.ReactElement<any>, {
                                                    parents: [
                                                        ...(displayProps.parents || []),
                                                        {
                                                            name: displayProps.data?.name || t('title.newItem', 'New Item'),
                                                            icon: displayProps.icon,
                                                            ref: detailContainerRef,
                                                        },
                                                    ],
                                                })
                                                : displayProps.relations}
                                        </Box>
                                    )}
                                </Stack>
                            </Box>

                            {/* HANDOFF · v2 04d.8 destructive dialog */}
                            <Dialog
                                open={deleteDialogOpen}
                                onClose={() => setDeleteDialogOpen(false)}
                                PaperProps={{sx: {width: 380, maxWidth: '90vw'}}}
                            >
                                <DialogTitle>
                                    {t('action.deleteFor', 'Delete {{type}}', {
                                        type: displayProps.type || t('toast.fallbackName', 'Item').toLowerCase(),
                                    })}
                                </DialogTitle>
                                <DialogContent sx={{pt: 2}}>
                                    <DialogContentText sx={{color: 'var(--ink-2)'}}>
                                        <Trans
                                            i18nKey="dialog.delete.confirmPrompt"
                                            ns="edm-master"
                                            values={{name: displayProps.data?.name}}
                                            components={[
                                                <Box
                                                    key="0"
                                                    component="span"
                                                    sx={{fontFamily: 'var(--font-mono)', color: 'var(--ink-1)', fontWeight: 700}}
                                                />,
                                            ]}
                                        />
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <MuiButton onClick={() => setDeleteDialogOpen(false)}>{t('action.cancel', 'Cancel')}</MuiButton>
                                    <MuiButton onClick={handleDelete} color="error" variant="contained" autoFocus>
                                        {t('action.deleteFor', 'Delete {{type}}', {
                                            type: displayProps.type || t('toast.fallbackName', 'Item').toLowerCase(),
                                        })}
                                    </MuiButton>
                                </DialogActions>
                            </Dialog>
                        </>
                    )}
                </Box>
            </Box>

            <Collapse in={!!props.subDetail} timeout={300}>
                <Box
                    ref={subDetailRef as any}
                    className={styles.subDetailWrapper}
                    sx={{minHeight: lockHeight > 0 ? `${lockHeight}px` : undefined, position: 'relative'}}
                >
                    {isFading && (
                        <Box className={styles.loadingOverlay}>
                            <Box className={styles.stickyIndicator}>
                                <CircularProgress size={32} />
                            </Box>
                        </Box>
                    )}
                    <Box sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        opacity: isFading ? 0.4 : 1,
                        filter: isFading ? 'grayscale(0.5)' : 'none',
                        transition: 'all 0.2s',
                    }}>
                        {React.isValidElement(bufferedSubDetail)
                            ? React.cloneElement(bufferedSubDetail as React.ReactElement<any>, {
                                parents: [
                                    ...(displayProps.parents || []),
                                    {
                                        name: displayProps.title || displayProps.data?.name || t('title.newItem', 'New Item'),
                                        icon: displayProps.icon,
                                        ref: detailContainerRef,
                                    },
                                ],
                            })
                            : bufferedSubDetail}
                    </Box>
                </Box>
            </Collapse>
        </Stack>
        </DetailEditModeContext.Provider>
    );
}

export interface InfoProps {
    content?: React.ReactNode;
    title?: string;
}

export function Info(props: InfoProps) {
    return (
        <Box>
            <Grid container spacing={2}>
                {props.content}
            </Grid>
        </Box>
    );
}

export function SmoothTabContainer({value, children, ...props}: {value: number; children?: React.ReactNode; [key: string]: any}) {
    const [bufferedValue, setBufferedValue] = useState(value);
    const [isPending, setIsPending] = useState(false);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [lockHeight, setLockHeight] = useState(0);

    React.useLayoutEffect(() => {
        if (value !== bufferedValue) {
            if (containerRef.current) {
                setLockHeight(containerRef.current.offsetHeight);
            }
            setIsPending(true);
            const timer = setTimeout(() => {
                setBufferedValue(value);
                setIsPending(false);
                setTimeout(() => setLockHeight(0), 300);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [value, bufferedValue]);

    return (
        <Box
            ref={containerRef as any}
            sx={{
                position: 'relative',
                minHeight: lockHeight > 0 ? `${lockHeight}px` : 'auto',
                width: '100%',
            }}
            {...props}
        >
            {isPending && (
                <Box className={styles.loadingOverlay}>
                    <Box className={styles.stickyIndicator}>
                        <CircularProgress size={32} />
                    </Box>
                </Box>
            )}
            <Box sx={{
                opacity: isPending ? 0.4 : 1,
                filter: isPending ? 'grayscale(0.5)' : 'none',
                transition: 'all 0.2s',
                pointerEvents: isPending ? 'none' : 'auto',
            }}>
                {React.Children.map(children, (child: any, index) => {
                    if (!child) return null;
                    const childIndex = child.props?.index !== undefined ? child.props.index : index;
                    if (childIndex === bufferedValue) {
                        return child;
                    }
                    return null;
                })}
            </Box>
        </Box>
    );
}

export interface InfoItemProps {
    label?: React.ReactNode;
    value?: React.ReactNode;
    children?: React.ReactNode;
    xs?: number;
    md?: number;
}

export function InfoItem({label, value, children, xs = 12, md = 6}: InfoItemProps) {
    return (
        <Grid item xs={xs} md={md}>
            <Box className={styles.infoItem}>
                <label>{label}</label>
                <Box className={styles.value}>
                    <Typography variant="body2" component="div">
                        {children || value || '—'}
                    </Typography>
                </Box>
            </Box>
        </Grid>
    );
}

export interface EditorProps {
    content?: React.ReactNode | ((args: {values: any; handleChange: (e: any) => void}) => React.ReactNode);
    setData: (data: any) => void;
    type?: string;
    onUpdate?: (data: any) => void;
    onChange?: (data: any) => void;
    title?: string;
    api: string;
    path?: string;
    data: any;
}

/** Flattens foreign-key-shaped values to their `.id` before sending. So
 *  `{nomenclature: {id: 5, name: 'Foo'}}` becomes `{nomenclature: 5}` —
 *  the wire format the EDM controllers expect. Dates and arrays are passed
 *  through untouched. Lifted from Logistics's Editor. */
function flattenForeignData(data: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {};
    for (const k of Object.keys(data)) {
        const v = data[k];
        if (v && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)) {
            out[k] = (v as any).id;
        } else {
            out[k] = v;
        }
    }
    return out;
}

export function Editor(props: EditorProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const {t} = useTranslation('edm-master');
    const setDetailEditMode = useContext(DetailEditModeContext);
    const invalidate = useOptionalInvalidateEntities();
    const [values, setValues] = useState<any>(props.data);
    const lastSyncedIdRef = useRef<unknown>(undefined);
    useEffect(() => {
        if (!props.data || props.data.id === undefined) return;
        if (lastSyncedIdRef.current === props.data.id) return;
        lastSyncedIdRef.current = props.data.id;
        setValues(props.data);
    }, [props.data]);

    const {dialog, confirm} = useDialog();

    const handleChange = (e: any) => {
        const {name, value} = e.target;
        setValues((prev: any) => ({...prev, [name]: value}));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const data = values;
        const foreignData = flattenForeignData(data);

        const onSaveError = (err: any) =>
            toast.error(err.response?.data?.detail || err.message || t('error.saveFailed', 'Save failed'));

        if (data.id) {
            // PUT path with fork-required handling: backends signal "this change
            // creates a new version" via 409 + `code: 'fork-required'`. The
            // user is asked to confirm; on yes we resend with `?force=true`.
            const sendUpdate = (force: boolean): Promise<any> => {
                const url = force
                    ? `${props.api}/${props.data.id}?force=true`
                    : `${props.api}/${props.data.id}`;
                return axios.put(url, foreignData)
                    .then((response) => {
                        toast.success(force
                            ? t('toast.savedAsNewVersion', 'Saved as a new version')
                            : t('toast.saved', 'Saved'));
                        props.onUpdate && props.onUpdate(response.data);
                        props.onChange && props.onChange(response.data);
                        props.setData(response.data);
                        if (props.type) {
                            invalidate([
                                {type: props.type},
                                {type: props.type, id: response.data.id},
                            ]);
                        }
                        setDetailEditMode?.(false);
                        if (force && props.path) {
                            navigate(`${props.path}/${response.data.id}`);
                        }
                    })
                    .catch((r) => {
                        if (
                            !force
                            && r.response?.status === 409
                            && r.response?.data?.code === 'fork-required'
                        ) {
                            const detail = r.response?.data?.detail
                                || t('editor.forkDefaultDetail', 'This change will create a new version.');
                            confirm({
                                title: t('editor.forkTitle', 'Create new version?'),
                                message: detail,
                                actionLabel: t('editor.forkAction', 'Create version'),
                                onConfirm: () => { sendUpdate(true); },
                            });
                            return;
                        }
                        onSaveError(r);
                    });
            };
            sendUpdate(false);
        } else {
            // _selectedItem.id is the MUI-prefixed tree id (e.g., "folder-<guid>");
            // the backend wants the raw Guid. numericId/parentId are the unprefixed
            // Guid strings — no parseInt needed since every consumer is Guid-keyed.
            const rawParent = _selectedItem
                ? (_selectedItem.isFolder ? _selectedItem.numericId : _selectedItem.parentId)
                : EMPTY_GUID;
            const parentId = rawParent || EMPTY_GUID;
            // Honor a route-state-supplied parentId (e.g. "Add child" navigations
            // that attach `state: {parentId}` so the new item lands in the right
            // folder regardless of which tree node is currently selected).
            const stateParent = (location.state as any)?.parentId;
            const effectiveParentId = stateParent ?? parentId;
            axios.post(`${props.api}`, {
                ...foreignData,
                type: props.type,
                // directoryId is the canonical field for DirectoryEntry-derived
                // backends (Tech post-unification, Logistics). parentId stays
                // for any caller that still binds to it.
                directoryId: effectiveParentId,
                parentId: effectiveParentId,
            })
                .then((response) => {
                    toast.success(t('toast.created', 'Created'));
                    props.onUpdate && props.onUpdate(response.data);
                    props.onChange && props.onChange(response.data);
                    props.setData(response.data);
                    if (props.type) {
                        invalidate([
                            {type: props.type},
                            {type: props.type, id: response.data.id},
                            listTag(props.type),
                        ]);
                    }
                    setDetailEditMode?.(false);
                    if (props.path) navigate(`${props.path}${response.data.isFolder ? '/folder' : ''}/${response.data.id}`);
                })
                .catch(onSaveError);
        }
    };

    const content = typeof props.content === 'function'
        ? props.content({values, handleChange})
        : (props.content && React.isValidElement(props.content)
            ? React.cloneElement(props.content as React.ReactElement<any>, {values, handleChange})
            : props.content);

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            {dialog}
            <Box>
                {content}
            </Box>

            <Box className={styles.stickyFooter}>
                <MuiButton
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                >
                    {t('action.saveChanges', 'Save Changes')}
                </MuiButton>
            </Box>
        </Box>
    );
}
