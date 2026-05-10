import React, {useState} from 'react';
import {useRouteMatch, useHistory, Switch, Route} from 'react-router-dom';
import axios from 'axios';
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
import {TreeNode} from './treeUtils';
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

export function reloadMaster() {
    refresh();
    if (_renderFunc) _renderFunc(++_render);
}

export interface MasterDetailProps {
    /** Data API root passed to TreeViewMaster (e.g. `/api/processes`). */
    api: string;
    /** Hierarchies API root for folder moves + folder edits (e.g. `/api/hierarchies`). */
    hierarchiesApi?: string;
    /** Detail element rendered for a leaf route. */
    detail?: React.ReactElement;
    /** Folder editor component rendered for folder routes. Omit to skip the folder route. */
    folderComponent?: React.ComponentType<{api?: string; path: string; onChange: () => void; onClose: () => void}>;
    /** Help message for the empty / no-selection stub. */
    stubMessage?: string;
    /** Override TreeViewMaster's entity-type detection. */
    entityTypeMap?: TreeViewMasterProps['entityTypeMap'];
    /** Override TreeViewMaster's icon map. */
    iconMap?: TreeViewMasterProps['iconMap'];
}

export function MasterDetail(props: MasterDetailProps) {
    const history = useHistory();
    const {path} = useRouteMatch();
    const [dynamicOffset, setDynamicOffset] = useState(10);
    const FolderComponent = props.folderComponent;

    React.useEffect(() => {
        const updateOffset = () => {
            const stickyHeaders = document.querySelectorAll('[data-sticky-header="true"]');
            let maxBottom = 0;
            stickyHeaders.forEach((header) => {
                const rect = header.getBoundingClientRect();
                maxBottom = Math.max(maxBottom, rect.bottom);
            });
            setDynamicOffset(maxBottom + 10);
        };

        const observer = new ResizeObserver(updateOffset);
        const headers = document.querySelectorAll('[data-sticky-header="true"]');
        headers.forEach((h) => observer.observe(h));

        updateOffset();
        window.addEventListener('scroll', updateOffset, {passive: true});

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', updateOffset);
        };
    }, []);

    return (
        <SmartScroll offsetTop={dynamicOffset} style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 12, width: '100%', minWidth: 0}}>
            <SmartScrollContent style={{flex: 1, minWidth: '280px'}}>
                <TreeViewMaster
                    api={props.api}
                    hierarchiesApi={props.hierarchiesApi}
                    onCurrentRootChanged={(root: TreeNode) => { _selectedItem = root; }}
                    entityTypeMap={props.entityTypeMap}
                    iconMap={props.iconMap}
                />
            </SmartScrollContent>
            <SmartScrollContent style={{flex: '5 1 0%', minWidth: 0, width: 0, overflow: 'hidden'}}>
                <Switch>
                    <Route exact path={path}>
                        <DetailStub
                            message={props.stubMessage}
                            onAdd={() => history.push(`${path}/0`)}
                        />
                    </Route>

                    {FolderComponent && (
                        <Route path={`${path}/folder/:id`}>
                            <FolderComponent
                                api={props.hierarchiesApi}
                                path={path}
                                onChange={() => reloadMaster()}
                                onClose={() => history.push(path)}
                            />
                        </Route>
                    )}
                    <Route path={`${path}/:id`}>
                        {props.detail}
                    </Route>
                </Switch>
            </SmartScrollContent>
        </SmartScroll>
    );
}

const pluralize = (type?: string): string => {
    if (!type) return 'Items';
    const name = type.charAt(0).toUpperCase() + type.slice(1);
    return name.endsWith('s') ? name + 'es' : name + 's';
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
    data: any;
    onChange?: () => void;
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
}

export function Detail(props: DetailProps) {
    const history = useHistory();
    const toast = useToast();
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
    let [editMode, setEditMode] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    editMode = editMode || props.id === 0;

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
        axios.delete(`${props.api}/${props.data.id}`)
            .then(() => {
                toast.success(`${props.data.name || 'Item'} deleted`);
                props.onChange && props.onChange();
                if (props.path) history.push(props.path);
            })
            .catch((err: any) => toast.error(err.response?.data?.detail || err.message || 'Delete failed'));
    };

    if (props.error) {
        return (
            <Box className={styles.detailContainer}>
                <ErrorStub
                    error={props.error}
                    onBack={() => props.path && history.push(props.path)}
                />
            </Box>
        );
    }

    return (
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
                                <Box className={`${styles.iconWrapper} ${displayProps.type ? (styles as any)[displayProps.type] || '' : ''}`}>
                                    {displayProps.icon || (displayProps.type === 'folder' ? <FolderIcon /> : <FileIcon />)}
                                </Box>

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
                                        {pluralize(displayProps.type)}
                                    </Typography>
                                </Breadcrumbs>

                                <Box className={styles.dpName}>
                                    <Typography variant="h6" className={styles.title}>
                                        {displayProps.data?.name || 'New Item'}
                                    </Typography>
                                </Box>

                                {displayProps.status && (
                                    <Box className={styles.dpStatus}>{displayProps.status}</Box>
                                )}

                                {displayProps.data?.description && (
                                    <Typography variant="body2" className={styles.description}>
                                        {displayProps.data.description}
                                    </Typography>
                                )}

                                <Box className={styles.actions}>
                                    {displayProps.editor && (
                                        <>
                                            <Tooltip title={editMode ? 'View mode' : 'Edit mode'}>
                                                <IconButton
                                                    className={styles.actionBtn}
                                                    onClick={() => setEditMode(!editMode)}
                                                    size="small"
                                                >
                                                    {editMode ? <ViewIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title='Copy'>
                                                <IconButton
                                                    className={styles.actionBtn}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const data = {...displayProps.data, id: 0, name: `${displayProps.data?.name} (Copy)`};
                                                        axios.post(`${displayProps.api}`, data)
                                                            .then((response) => {
                                                                toast.success('Copied');
                                                                displayProps.onChange && displayProps.onChange();
                                                                if (displayProps.path) history.push(`${displayProps.path}/${response.data.id}`);
                                                            })
                                                            .catch((err: any) => toast.error(err.response?.data?.detail || err.message || 'Copy failed'));
                                                    }}
                                                    size="small"
                                                >
                                                    <CopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title='Delete'>
                                                <IconButton
                                                    className={`${styles.actionBtn} ${styles.delete}`}
                                                    onClick={() => setDeleteDialogOpen(true)}
                                                    size="small"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                    {displayProps.onClose && (
                                        <Tooltip title='Close'>
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
                                                            name: displayProps.data?.name || 'New Item',
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
                                <DialogTitle>Delete {displayProps.type || 'item'}</DialogTitle>
                                <DialogContent sx={{pt: 2}}>
                                    <DialogContentText sx={{color: 'var(--ink-2)'}}>
                                        Permanently delete{' '}
                                        <Box component="span" sx={{fontFamily: 'var(--font-mono)', color: 'var(--ink-1)', fontWeight: 700}}>
                                            {displayProps.data?.name}
                                        </Box>
                                        ? This action cannot be undone.
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <MuiButton onClick={() => setDeleteDialogOpen(false)}>Cancel</MuiButton>
                                    <MuiButton onClick={handleDelete} color="error" variant="contained" autoFocus>
                                        Delete {displayProps.type || 'item'}
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
                        {bufferedSubDetail}
                    </Box>
                </Box>
            </Collapse>
        </Stack>
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

export function Editor(props: EditorProps) {
    const history = useHistory();
    const toast = useToast();
    const [values, setValues] = useState<any>(props.data);

    const handleChange = (e: any) => {
        const {name, value} = e.target;
        setValues((prev: any) => ({...prev, [name]: value}));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const data = values;

        const onSaveError = (err: any) =>
            toast.error(err.response?.data?.detail || err.message || 'Save failed');

        if (data.id) {
            axios.put(`${props.api}/${props.data.id}`, data)
                .then((response) => {
                    toast.success('Saved');
                    props.onUpdate && props.onUpdate(response.data);
                    props.onChange && props.onChange(response.data);
                    props.setData(response.data);
                })
                .catch(onSaveError);
        } else {
            const parentId = _selectedItem ? (_selectedItem.isNode ? _selectedItem.id : _selectedItem.parentId) : 0;
            axios.post(`${props.api}`, {...data, type: props.type, parentId, hierarchyId: parentId})
                .then((response) => {
                    toast.success('Created');
                    props.onUpdate && props.onUpdate(response.data);
                    props.onChange && props.onChange(response.data);
                    props.setData(response.data);
                    if (props.path) history.push(`${props.path}${response.data.isNode ? '/folder' : ''}/${response.data.id}`);
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
                    Save Changes
                </MuiButton>
            </Box>
        </Box>
    );
}
