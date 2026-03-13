import React, { useState } from "react";
import { useRouteMatch, useHistory, Switch, Route } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import { 
    Box, 
    Typography, 
    IconButton, 
    Tooltip, 
    Grid, 
    Button as MuiButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Breadcrumbs,
    Link,
    Alert,
    Stack,
    Collapse,
    Fade,
    CircularProgress
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
    InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { TreeViewMaster, refresh } from "./TreeViewMaster";
import { Loading, DetailStub, ErrorStub } from "./utils/Utils";
import api from './api';

import { Folder } from "./config/Folder";
import { SmartScroll, SmartScrollContent } from "@microprojects/tools";
import styles from './Detail.module.scss';

export function reloadMaster() {
    refresh();
    _renderFunc(++_render);
}

let _selectedItem, _render = 0, _renderFunc;

MasterDetail.propTypes = {
    card: PropTypes.func,
    editor: PropTypes.func,
    api: PropTypes.string,
    detail: PropTypes.element,
    item: PropTypes.func,
    stubMessage: PropTypes.string
};

export function MasterDetail(props) {
    const history = useHistory();
    let { path } = useRouteMatch();
    const [dynamicOffset, setDynamicOffset] = useState(10);

    React.useEffect(() => {
        const updateOffset = () => {
            const stickyHeaders = document.querySelectorAll('[data-sticky-header="true"]');
            let maxBottom = 0;
            stickyHeaders.forEach(header => {
                const rect = header.getBoundingClientRect();
                // We only care about headers that are fixed or sticky at the top
                maxBottom = Math.max(maxBottom, rect.bottom);
            });
            setDynamicOffset(maxBottom + 10); // 10px gap
        };

        const observer = new ResizeObserver(updateOffset);
        const headers = document.querySelectorAll('[data-sticky-header="true"]');
        headers.forEach(h => observer.observe(h));

        updateOffset();
        window.addEventListener('scroll', updateOffset, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', updateOffset);
        };
    }, []);

    return (
        <SmartScroll offsetTop={dynamicOffset} style={{display: "flex", flexDirection: "row", alignItems: 'flex-start', gap: 12, width: '100%', minWidth: 0}}>
                <SmartScrollContent style={{ flex: 1, minWidth: '280px' }}>
                    <TreeViewMaster api={props.api}
                        onCurrentRootChanged={(root) => (_selectedItem = root)}
                        item={props.item}
                    />
                </SmartScrollContent>
                <SmartScrollContent style={{ flex: '5 1 0%', minWidth: 0, width: 0, overflow: 'hidden' }}>

                    <Switch>

                        <Route exact path={path}>
                            <DetailStub 
                                message={props.stubMessage} 
                                onAdd={() => history.push(`${path}/0`)}
                            />
                        </Route>

                        <Route path={`${path}/folder/:id`}>
                            <Folder
                                api={api.hierarchies}
                                path={path}
                                onChange={() => reloadMaster()}
                                onClose={() => history.push(path)}
                            />
                        </Route>
                        <Route path={`${path}/:id`}>
                            {props.detail}
                        </Route>
                    </Switch>
                </SmartScrollContent>
        </SmartScroll>
    );
}

const pluralize = (type) => {
    if (!type) return 'Items';
    const name = type.charAt(0).toUpperCase() + type.slice(1);
    return name.endsWith('s') ? name + 'es' : name + 's';
};

const scrollToRef = (ref) => {
    if (ref && ref.current) {
        // Try to find the card header first for better alignment
        const header = ref.current.querySelector(`[data-card-header="true"]`);
        const target = header || ref.current;
        const rect = target.getBoundingClientRect();
        
        const stickyHeaders = document.querySelectorAll('[data-sticky-header="true"]');
        let maxBottom = 0;
        stickyHeaders.forEach(h => {
            const hRect = h.getBoundingClientRect();
            maxBottom = Math.max(maxBottom, hRect.bottom);
        });

        window.scrollTo({
            top: window.scrollY + rect.top - maxBottom - 10,
            behavior: 'smooth'
        });
    }
};

Detail.propTypes = {
    card: PropTypes.node,
    icon: PropTypes.element,
    editor: PropTypes.node,
    relations: PropTypes.node,
    subDetail: PropTypes.element,
    id: PropTypes.any,
    loading: PropTypes.any,
    error: PropTypes.any,
    validation: PropTypes.string,
    data: PropTypes.object,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    onUp: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    editable: PropTypes.bool,
    copyable: PropTypes.bool,
    deletable: PropTypes.bool,
    type: PropTypes.string,
    parents: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        icon: PropTypes.node,
        ref: PropTypes.any
    }))
};


Detail.defaultProps = {
    editable: true,
    copyable: true,
    deletable: true,
};

export function Detail(props) {
    const history = useHistory();
    const subDetailRef = React.useRef(null);
    const detailContainerRef = React.useRef(null);
    const [bufferedSubDetail, setBufferedSubDetail] = useState(props.subDetail);
    
    // Main detail transition states
    const [displayProps, setDisplayProps] = useState(props);
    const [isMainFading, setIsMainFading] = useState(false);
    
    const [isFading, setIsFading] = useState(false);
    const [lockHeight, setLockHeight] = useState(0);
    let [_, setRefresh] = useState(0, _render);
    _renderFunc = setRefresh;
    let [editMode, setEditMode] = useState(false);
    let [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    editMode = editMode || props.id === 0;

    // Handle main detail transitions
    React.useLayoutEffect(() => {
        const isLoadingChanged = props.loading !== displayProps.loading;
        const isIdChanged = props.id !== displayProps.id;

        if (isLoadingChanged || isIdChanged) {
            // Capture current container height before swap to prevent document jump
            if (detailContainerRef.current) {
                setLockHeight(detailContainerRef.current.offsetHeight);
            }
            
            setIsMainFading(true);
            const timer = setTimeout(() => {
                setDisplayProps(props);
                setIsMainFading(false);
                // Reset height lock after new content had a chance to render and fade in
                setTimeout(() => setLockHeight(0), 300);
            }, 200);
            return () => clearTimeout(timer);
        } else {
            // Keep content updated if it's not a loading/ID change (e.g. data update)
            setDisplayProps(props);
        }
    }, [props, displayProps.loading, displayProps.id]);

    // Handle buffered subdetail transitions with height locking
    React.useLayoutEffect(() => {
        if (props.subDetail !== bufferedSubDetail) {
            // Capture current container height before swap to prevent document jump
            if (detailContainerRef.current) {
                setLockHeight(detailContainerRef.current.offsetHeight);
            }
            
            setIsFading(true);
            const timer = setTimeout(() => {
                setBufferedSubDetail(props.subDetail);
                setIsFading(false);
                // Reset height lock after new content had a chance to render and fade in
                setTimeout(() => setLockHeight(0), 300);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [props.subDetail, bufferedSubDetail]);

    React.useEffect(() => {
        if (bufferedSubDetail && subDetailRef.current && !isFading) {
            // Wait for potential Fade/content render to finish
            const timer = setTimeout(() => {
                if (!subDetailRef.current) return;
                const rect = subDetailRef.current.getBoundingClientRect();
                const stickyHeaders = document.querySelectorAll('[data-sticky-header="true"]');
                let maxBottom = 0;
                stickyHeaders.forEach(header => {
                    maxBottom = Math.max(maxBottom, header.getBoundingClientRect().bottom);
                });

                if (rect.top < maxBottom || rect.top > window.innerHeight - 100) {
                    window.scrollTo({
                        top: window.scrollY + rect.top - maxBottom - 10,
                        behavior: 'smooth'
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
                props.onChange();
                history.push(props.path);
            });
    };

    if (props.error) {
        return (
            <Box className={styles.detailContainer}>
                <ErrorStub 
                    error={props.error} 
                    onBack={() => history.push(props.path)} 
                />
            </Box>
        );
    }

    return (
        <Stack spacing={2} ref={detailContainerRef} sx={{ minHeight: lockHeight > 0 ? `${lockHeight}px` : 'auto', width: '100%', minWidth: 0, position: 'relative' }}>
            <Box className={styles.detailContainer} sx={{ width: '100%', minWidth: 0, position: 'relative' }}>
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
                    transition: 'all 0.2s'
                }}>
                    {(displayProps.loading && displayProps.id) ? (
                        <Loading />
                    ) : (

                        <>
                                {/* Sticky Industrial Header */}
                                <Box 
                                    data-card-header="true"
                                    className={`${styles.stickyHeader} ${displayProps.type ? styles[displayProps.type] : ''}`}
                                >

                                <Box className={styles.headerContent}>
                                    <Box className={`${styles.iconWrapper} ${displayProps.type === 'folder' ? styles.orange : styles.gray}`}>
                                        {displayProps.icon || (displayProps.type === 'folder' ? <FolderIcon /> : <FileIcon />)}
                                    </Box>
                                        <Box className={styles.titleArea}>
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
                                                        onClick={(e) => { e.preventDefault(); scrollToRef(p.ref); }}
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                                                    >
                                                        {p.icon && React.cloneElement(p.icon, { sx: { fontSize: '12px !important' } })}
                                                        {p.name}
                                                    </Link>
                                                ))}
                                                <Typography 
                                                    variant="caption" 
                                                    color="inherit" 
                                                    component="span"
                                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                >
                                                    {displayProps.icon && React.cloneElement(displayProps.icon, { sx: { fontSize: '12px !important' } })}
                                                    {pluralize(displayProps.type)}
                                                </Typography>
                                            </Breadcrumbs>
                                            <Typography variant="h6" className={styles.title}>

                                            {displayProps.data.name || 'New Item'}
                                        </Typography>
                                        {displayProps.data.description && (
                                            <Typography variant="body2" className={styles.description}>
                                                {displayProps.data.description}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

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
                                                        let data = { ...displayProps.data, id: 0, name: `${displayProps.data.name} (Copy)` };
                                                        axios.post(`${displayProps.api}`, data)
                                                            .then((response) => {
                                                                displayProps.onChange();
                                                                history.push(`${displayProps.path}/${response.data.id}`);
                                                            });
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

                            {/* Content Body */}
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
                                                    ? React.cloneElement(displayProps.relations, {
                                                        parents: [
                                                            ...(displayProps.parents || []),
                                                            {
                                                                name: displayProps.data.name || 'New Item',
                                                                icon: displayProps.icon,
                                                                ref: detailContainerRef
                                                            }
                                                        ]
                                                    })
                                                    : displayProps.relations}
                                            </Box>
                                        )}

                                </Stack>
                            </Box>

                            {/* Delete Confirmation Dialog */}
                            <Dialog
                                open={deleteDialogOpen}
                                onClose={() => setDeleteDialogOpen(false)}
                            >
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        Are you sure you want to delete "{displayProps.data.name}"? This action cannot be undone.
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <MuiButton onClick={() => setDeleteDialogOpen(false)}>Cancel</MuiButton>
                                    <MuiButton onClick={handleDelete} color="error" variant="contained" autoFocus>
                                        Delete
                                    </MuiButton>
                                </DialogActions>
                            </Dialog>

                        </>
                    )}
                </Box>
            </Box>

            <Collapse in={!!props.subDetail} timeout={300}>
                <Box 
                    ref={subDetailRef} 
                    className={styles.subDetailWrapper}
                    sx={{ minHeight: lockHeight > 0 ? `${lockHeight}px` : undefined, position: 'relative' }}
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
                        transition: 'all 0.2s'
                    }}>
                        {bufferedSubDetail}
                    </Box>
                </Box>
            </Collapse>
        </Stack>
    );
}

Info.propTypes = {
    content: PropTypes.node,
    title: PropTypes.string
}

export function Info(props) {
    return (
        <Box>
            <Grid container spacing={2}>
                {props.content}
            </Grid>
        </Box>
    );
}

export function SmoothTabContainer({ value, children, ...props }) {
    const [bufferedValue, setBufferedValue] = useState(value);
    const [isPending, setIsPending] = useState(false);
    const containerRef = React.useRef(null);
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
            ref={containerRef}
            sx={{ 
                position: 'relative', 
                minHeight: lockHeight > 0 ? `${lockHeight}px` : 'auto',
                width: '100%'
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
                pointerEvents: isPending ? 'none' : 'auto'
            }}>
                {React.Children.map(children, (child, index) => {
                    if (!child) return null;
                    // Support both components that have 'index' prop and just positional children
                    const childIndex = child.props.index !== undefined ? child.props.index : index;
                    if (childIndex === bufferedValue) {
                        return child;
                    }
                    return null;
                })}
            </Box>
        </Box>
    );
}

export function InfoItem({ label, value, children, xs = 12, md = 6 }) {
    return (
        <Grid item xs={xs} md={md}>
            <Box className={styles.infoItem}>
                <label>{label}</label>
                <Box className={styles.value}>
                    <Typography variant="body2" component="div">
                        {children || value || "—"}
                    </Typography>
                </Box>
            </Box>
        </Grid>
    );
}


Editor.propTypes = {
    content: PropTypes.node,
    setData: PropTypes.func,
    type: PropTypes.string,
    onUpdate: PropTypes.func,
    title: PropTypes.string
}

export function Editor(props) {
    const history = useHistory();
    const [values, setValues] = useState(props.data);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const data = values;

        if (data.id) {
            axios.put(`${props.api}/${props.data.id}`, data)
                .then((response) => {
                    props.onUpdate && props.onUpdate(response.data);
                    props.onChange && props.onChange(response.data)
                    props.setData(response.data);
                })
        } else {
            const parentId = _selectedItem ? (_selectedItem.isNode ? _selectedItem.id : _selectedItem.parentId) : 0;
            axios.post(`${props.api}`, { ...data, type: props.type, parentId: parentId, hierarchyId: parentId })
                .then((response) => {
                    props.onUpdate && props.onUpdate(response.data);
                    props.onChange && props.onChange(response.data)
                    props.setData(response.data);
                    history.push(`${props.path}${response.data.isNode ? '/folder' : ''}/${response.data.id}`);
                });
        }
    };

    // Clone content and inject props if it's a function or element
    const content = typeof props.content === 'function' 
        ? props.content({ values, handleChange }) 
        : React.cloneElement(props.content, { values, handleChange });

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box>
                {content}
            </Box>
            
            {/* Sticky Industrial Footer */}

            <Box className={styles.stickyFooter}>
                <MuiButton
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    sx={{ borderRadius: '4px', textTransform: 'none' }}
                >
                    Save Changes
                </MuiButton>
            </Box>
        </Box>
    );
}
