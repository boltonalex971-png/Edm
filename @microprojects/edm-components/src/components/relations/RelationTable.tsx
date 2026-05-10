import React, {useState, useMemo, useCallback} from 'react';
import axios from 'axios';
import {
    Box,
    TextField,
    IconButton,
    Tooltip,
    Button as MuiButton,
    CircularProgress,
    Alert,
    Fade,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    InboxOutlined as EmptyIcon,
} from '@mui/icons-material';
import {DataGrid, GridRowModes} from '@mui/x-data-grid';

import {useGet} from '../../hooks/useGet';
import {ParentContext} from '../master/ParentContext';
import {useDialog} from '../../hooks/useDialog';
import {useToast} from '../states/Toast';
import {useUiPreferences} from '../../styles/UiPreferencesContext';
import styles from './RelationTable.module.scss';

/* DataGrid's own density names don't match ours: map the global
   density choice to the closest DataGrid preset so the data table
   visibly grows/shrinks with the rest of the chrome. */
const DENSITY_TO_GRID: Record<string, 'compact' | 'standard' | 'comfortable'> = {
    compact: 'compact',
    comfortable: 'standard',
    touch: 'comfortable',
};

// HANDOFF · v2 04c.2 production data table.
// Toolbar (search · spacer · primary add) sits ABOVE the grid; per-row
// actions live in a dedicated 96 px column appended after the caller
// columns; deletes go through v2 destructive dialog; errors surface as
// toasts. Everything visual is the consumer's MuiDataGrid theme override
// plus this module's toolbar/actions chrome.

// Default edit-cell renderer for plain string columns. MUI's built-in
// editInputCell is a borderless <input> that doesn't match the v2
// outlined input chrome — wrapping in TextField gives every editable
// column the same look (Description, Name, etc.) without each call site
// having to provide its own `cell` prop.
export function DefaultEditCell({id, field, value, api}: any) {
    return (
        <Box sx={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', px: 0.5}}>
            <TextField
                value={value ?? ''}
                onChange={(e) => api.setEditCellValue({id, field, value: e.target.value})}
                size="small"
                variant="outlined"
                autoFocus
                fullWidth
                sx={{
                    '& .MuiInputBase-root': {
                        fontSize: '14px',
                        background: 'var(--surface)',
                    },
                    '& .MuiOutlinedInput-input': {
                        py: '4px',
                        px: '8px',
                    },
                }}
            />
        </Box>
    );
}

// Utility to parse <GridColumn>-style children into MUI GridColDef
export const parseChildrenToColumns = (children: React.ReactNode, options: {editable?: boolean; onRowSelected?: (row: any) => void} = {}): any[] => {
    const {editable} = options;
    const columns: any[] = [];

    React.Children.forEach(children, (child: any) => {
        if (!child || !child.props) return;

        const {field, title, width, cell, editable: colEditable, ...childProps} = child.props;
        if (!field && !title && !cell) return;

        const colDef: any = {
            field: field || `custom_${Math.random().toString(36).substr(2, 9)}`,
            headerName: title || '',
            width: width || 150,
            flex: width ? 0 : 1,
            editable: colEditable !== false && editable !== false,
            sortable: true,
        };

        if (cell) {
            const renderCustomCell = (params: any, isEdit: boolean) => {
                const cellProps = {
                    ...params,
                    ...childProps,
                    dataItem: params.row,
                    inEdit: isEdit,
                    field: params.field,
                    value: params.value,
                    onChange: (e: any) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.value,
                        });
                    },
                };
                return cell(cellProps);
            };

            colDef.renderCell = (params: any) => renderCustomCell(params, false);
            colDef.renderEditCell = (params: any) => renderCustomCell(params, true);
        }

        columns.push(colDef);
    });

    return columns;
};

export interface RelationTableProps {
    api?: string;
    children?: React.ReactNode;
    columns?: any[];
    data?: any[];
    editable?: boolean;
    removable?: boolean;
    selectable?: boolean;
    onRowSelected?: (row: any) => void;
}

export function RelationTable({
    api,
    children,
    columns: propColumns,
    data: propData,
    editable = true,
    removable = true,
    selectable = false,
    onRowSelected,
}: RelationTableProps) {
    const [reload, setReload] = useState(false);
    const [rowModesModel, setRowModesModel] = useState<Record<string, any>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const gridWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const toast = useToast();
    const {dialog, warning} = useDialog();
    const {density: uiDensity} = useUiPreferences();

    const [isFading, setIsFading] = useState(false);
    const [lockHeight, setLockHeight] = useState(0);
    const [displayData, setDisplayData] = useState<any[]>([]);
    const [isOverlayLoading, setIsOverlayLoading] = useState(false);

    const [[fetchedData, setFetchedData], loading, error] = useGet(api || null, [reload]);

    const rawData = propData || fetchedData;

    const data: any[] = useMemo(() => {
        if (!rawData || !Array.isArray(rawData)) return [];
        return rawData.map((row: any, index: number) => {
            if (!row || typeof row !== 'object') return {id: `row-${index}`};
            const normalized: any = {...row};
            Object.keys(row).forEach((key) => {
                const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
                if (camelKey !== key && normalized[camelKey] === undefined) {
                    normalized[camelKey] = row[key];
                }
            });
            let id = normalized.id ?? normalized.Id ?? normalized.guid ?? normalized.Guid ?? normalized.key;
            if (id === undefined || id === null || typeof id === 'object') {
                id = `row-${index}`;
            }
            normalized.id = id;
            return normalized;
        });
    }, [rawData]);

    const [currentApi, setCurrentApi] = useState<string | undefined>(api);

    React.useLayoutEffect(() => {
        if (api !== currentApi) {
            if (displayData && displayData.length > 0) {
                setIsOverlayLoading(true);
                if (gridWrapperRef.current) {
                    setLockHeight(gridWrapperRef.current.offsetHeight);
                }
            } else {
                setCurrentApi(api);
                setDisplayData([]);
            }
        }
    }, [api, currentApi, displayData]);

    React.useLayoutEffect(() => {
        if (!loading && api === currentApi) {
            setDisplayData(data);
            setIsOverlayLoading(false);
        } else if (!loading && api !== currentApi) {
            setIsFading(true);
            const timer = setTimeout(() => {
                setCurrentApi(api);
                setDisplayData(data);
                setIsFading(false);
                setIsOverlayLoading(false);
                setTimeout(() => setLockHeight(0), 300);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [data, loading, api, currentApi]);

    const setData = useCallback((newData: any) => {
        if (api && setFetchedData) {
            setFetchedData(newData);
        }
    }, [api, setFetchedData]);

    const handleEditClick = (id: any) => () => {
        setRowModesModel({...rowModesModel, [id]: {mode: GridRowModes.Edit}});
    };

    const handleSaveClick = (id: any) => () => {
        setRowModesModel({...rowModesModel, [id]: {mode: GridRowModes.View}});
    };

    const handleDeleteClick = (id: any, name?: string) => () => {
        warning({
            title: 'Delete record?',
            message: name
                ? `Permanently delete "${name}". This action cannot be undone.`
                : 'Permanently delete this record. This action cannot be undone.',
            actionLabel: 'Delete',
            onConfirm: async () => {
                try {
                    await axios.delete(`${api}/${id}`);
                    toast.success('Record deleted');
                    setReload((r) => !r);
                } catch (err: any) {
                    toast.error(err.response?.data?.detail || err.response?.data?.title || err.message || 'Failed to delete');
                }
            },
        });
    };

    const handleCancelClick = (id: any) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: {mode: GridRowModes.View, ignoreModifications: true},
        });

        const editedRow = data.find((row) => row.id === id);
        if (editedRow?.isNew) {
            setData(data.filter((row) => row.id !== id));
        }
    };

    const processRowUpdate = async (newRow: any) => {
        const isNew = newRow.isNew;
        const dataToSave: any = {...newRow};
        delete dataToSave.isNew;

        if (isNew) {
            dataToSave.id = 0;
        }

        try {
            const response = isNew
                ? await axios.post(`${api}`, dataToSave)
                : await axios.put(`${api}`, dataToSave);

            const updatedRow = {...response.data, isNew: false};
            setData(data.map((row) => (row.id === newRow.id ? updatedRow : row)));
            toast.success(isNew ? 'Record created' : 'Record saved');
            return updatedRow;
        } catch (err: any) {
            toast.error(err.response?.data?.detail || err.response?.data?.title || err.message || 'Failed to save');
            throw err;
        }
    };

    const addRecord = () => {
        const id = `new-${Math.random().toString(36).substr(2, 9)}`;
        const newRow: any = {id, isNew: true};
        setData([newRow, ...data]);
        const firstField = columns[0]?.field;
        setRowModesModel((oldModel) => ({
            ...oldModel,
            [id]: {mode: GridRowModes.Edit, fieldToFocus: firstField},
        }));
    };

    const renderActionsCell = useCallback((params: any) => {
        const id = params.id;
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        const rowName = params.row?.name || params.row?.Name;

        return (
            <Box className={`${styles.actionsCell} ${isInEditMode ? styles.editing : ''}`}>
                {isInEditMode ? (
                    <>
                        <Tooltip title="Save">
                            <span>
                                <IconButton size="small" className={`${styles.actionBtn} ${styles.save}`} onClick={handleSaveClick(id)}>
                                    <SaveIcon fontSize="small"/>
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Cancel">
                            <span>
                                <IconButton size="small" className={styles.actionBtn} onClick={handleCancelClick(id)}>
                                    <CloseIcon fontSize="small"/>
                                </IconButton>
                            </span>
                        </Tooltip>
                    </>
                ) : (
                    <>
                        <Tooltip title="Edit">
                            <span>
                                <IconButton
                                    size="small"
                                    className={styles.actionBtn}
                                    onClick={handleEditClick(id)}
                                    disabled={editable === false}
                                >
                                    <EditIcon fontSize="small"/>
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <span>
                                <IconButton
                                    size="small"
                                    className={`${styles.actionBtn} ${styles.delete}`}
                                    onClick={handleDeleteClick(id, rowName)}
                                    disabled={removable === false}
                                >
                                    <DeleteIcon fontSize="small"/>
                                </IconButton>
                            </span>
                        </Tooltip>
                    </>
                )}
            </Box>
        );
    }, [rowModesModel, editable, removable]);

    const columns: any[] = useMemo(() => {
        const baseColumns = (propColumns || parseChildrenToColumns(children, {
            editable,
            onRowSelected,
        })).map((col: any) => {
            if (editable !== false) {
                const updatedCol = {...col, editable: col.editable !== false};
                if (updatedCol.renderCell && !updatedCol.renderEditCell) {
                    updatedCol.renderEditCell = updatedCol.renderCell;
                }
                /* No custom edit renderer? Fall back to the v2 TextField
                   default so plain string columns (description, name, …)
                   render with the same outlined input as the rest. */
                if (updatedCol.editable && !updatedCol.renderEditCell) {
                    updatedCol.renderEditCell = (params: any) => <DefaultEditCell {...params} />;
                }
                return updatedCol;
            }
            return col;
        });

        if (baseColumns.length === 0) return baseColumns;

        // Append a dedicated, fixed-width actions column. v2 04c.2: hover
        // reveals row actions; no overlay-on-last-cell hacks.
        const actionsCol = {
            field: '__actions',
            headerName: '',
            width: 96,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            resizable: false,
            editable: false,
            renderCell: renderActionsCell,
            renderEditCell: renderActionsCell,
            align: 'right',
            headerAlign: 'right',
        };

        return [...baseColumns, actionsCol];
    }, [children, propColumns, editable, onRowSelected, renderActionsCell]);

    const currentData = useMemo(() => {
        if (isFading || (api !== currentApi && displayData.length > 0)) return displayData;
        return data;
    }, [data, displayData, isFading, api, currentApi]);

    const filteredRows = useMemo(() => {
        if (!currentData) return [];
        if (!searchQuery) return currentData;
        const query = searchQuery.toLowerCase();
        return currentData.filter((row: any) =>
            Object.values(row).some((val: any) =>
                String(val).toLowerCase().includes(query)
            )
        );
    }, [currentData, searchQuery]);

    const showInlineLoader = loading && !currentData?.length && !isOverlayLoading;
    const isEmpty = !showInlineLoader && filteredRows.length === 0 && !error;

    return (
        <ParentContext.Provider value={{itemUpdate: () => setReload(!reload)}}>
            <Box className={styles.tableContainer}>
                {dialog}
                {error && <Alert severity="error">{error}</Alert>}

                {/* HANDOFF · v2 04c.2 toolbar — search left, primary add right. */}
                <Box className={styles.toolbar}>
                    <TextField
                        className={styles.searchField}
                        placeholder="Search…"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon fontSize="small" sx={{mr: 1, color: 'var(--ink-4)'}}/>,
                        }}
                    />
                    <span className={styles.toolbarSpacer}/>
                    {editable !== false && (
                        <MuiButton
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon/>}
                            onClick={addRecord}
                            className={styles.addBtn}
                        >
                            Add record
                        </MuiButton>
                    )}
                </Box>

                {showInlineLoader && (
                    <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}>
                        <CircularProgress size={32}/>
                    </Box>
                )}

                {isEmpty && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <EmptyIcon/>
                        </div>
                        <div className={styles.emptyTitle}>
                            {searchQuery ? 'No matches' : 'No records yet'}
                        </div>
                        <div className={styles.emptyHelp}>
                            {searchQuery
                                ? `Nothing matches "${searchQuery}". Try a different search term.`
                                : editable === false
                                    ? 'This list is read-only and currently has no entries.'
                                    : 'Use Add record to create the first one.'}
                        </div>
                    </div>
                )}

                {!showInlineLoader && !isEmpty && (
                    <Box
                        ref={gridWrapperRef}
                        className={`${styles.gridWrapper} ${isOverlayLoading ? styles.dimmed : ''}`}
                        sx={{
                            height: filteredRows.length > 0 ? 'auto' : 200,
                            minHeight: lockHeight > 0 ? `${lockHeight}px` : 200,
                            position: 'relative',
                        }}
                    >
                        {isOverlayLoading && (
                            <Box className={styles.loadingOverlay}>
                                <Box className={styles.stickyIndicator}>
                                    <CircularProgress size={32}/>
                                </Box>
                            </Box>
                        )}
                        <Fade in={!isFading} timeout={200}>
                            <Box sx={{height: '100%'}}>
                                <DataGrid
                                    rows={filteredRows}
                                    columns={columns}
                                    editMode="row"
                                    density={DENSITY_TO_GRID[uiDensity] || 'standard'}
                                    rowModesModel={rowModesModel}
                                    onRowModesModelChange={(newModel: any) => setRowModesModel(newModel)}
                                    onRowEditStart={(_params: any, event: any) => { event.defaultMuiPrevented = true; }}
                                    onRowEditStop={(_params: any, event: any) => { event.defaultMuiPrevented = true; }}
                                    processRowUpdate={processRowUpdate}
                                    onProcessRowUpdateError={(err: any) => console.error('Error processing row update:', err)}
                                    onRowSelectionModelChange={(newSelectionModel: any) => {
                                        if (onRowSelected && newSelectionModel.length > 0) {
                                            const selectedRow = currentData.find((r: any) => r.id === newSelectionModel[0]);
                                            if (selectedRow) onRowSelected(selectedRow);
                                        }
                                    }}
                                    checkboxSelection={!!selectable}
                                    disableRowSelectionOnClick
                                    hideFooter={filteredRows.length < 10}
                                    autoHeight={filteredRows.length < 15}
                                    pageSizeOptions={[10, 25, 50]}
                                    initialState={{pagination: {paginationModel: {pageSize: 25}}}}
                                />
                            </Box>
                        </Fade>
                    </Box>
                )}
            </Box>
        </ParentContext.Provider>
    );
}
