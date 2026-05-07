import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { 
    Box, 
    TextField, 

    IconButton, 
    Tooltip, 
    Button as MuiButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Alert,
    Fade
} from '@mui/material';

import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { 
    DataGrid, 
    GridRowModes, 
} from '@mui/x-data-grid';

import { useGet } from './hooks/hooks';
import { ParentContext } from './ParentContext';
import styles from './RelationTable.module.scss';

// Utility to parse GridColumn children into MUI GridColDef
const parseChildrenToColumns = (children, options = {}) => {
    const { onRowSelected, editable } = options;
    const columns = [];
    
    React.Children.forEach(children, (child) => {
        if (!child || !child.props) return;
        
        const { field, title, width, cell, editable: colEditable, ...childProps } = child.props;
        if (!field && !title && !cell) return;

        const colDef = {
            field: field || `custom_${Math.random().toString(36).substr(2, 9)}`,
            headerName: title || '',
            width: width || 150,
            flex: width ? 0 : 1,
            editable: colEditable !== false && editable !== false,
            sortable: true,
        };

        if (cell) {
            const renderCustomCell = (params, isEdit) => {
                const cellProps = {
                    ...params,
                    ...childProps,
                    dataItem: params.row,
                    inEdit: isEdit,
                    field: params.field,
                    value: params.value,
                    onChange: (e) => {
                        params.api.setEditCellValue({ 
                            id: params.id, 
                            field: params.field, 
                            value: e.value 
                        });
                    },
                };
                return cell(cellProps);
            };

            colDef.renderCell = (params) => renderCustomCell(params, false);
            colDef.renderEditCell = (params) => renderCustomCell(params, true);
        }

        columns.push(colDef);
    });

    return columns;
};

export function RelationTable({ api, children, columns: propColumns, data: propData, ...props }) {
    const [reload, setReload] = useState(false);
    const [rowModesModel, setRowModesModel] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const gridWrapperRef = React.useRef(null);
    
    // Transition states
    const [isFading, setIsFading] = useState(false);
    const [lockHeight, setLockHeight] = useState(0);
    const [displayData, setDisplayData] = useState([]);
    const [isOverlayLoading, setIsOverlayLoading] = useState(false);

    // Only call useGet if api is provided
    const [[fetchedData, setFetchedData], loading, error] = useGet(api || null, [reload]);

    const rawData = propData || fetchedData;

    const data = useMemo(() => {
        if (!rawData || !Array.isArray(rawData)) return [];
        return rawData.map((row, index) => {
            if (!row || typeof row !== 'object') return { id: `row-${index}` };
            const normalized = { ...row };
            Object.keys(row).forEach(key => {
                const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
                if (camelKey !== key && normalized[camelKey] === undefined) {
                    normalized[camelKey] = row[key];
                }
            });
            // Ensure MUI DataGrid has a unique id
            let id = normalized.id ?? normalized.Id ?? normalized.guid ?? normalized.Guid ?? normalized.key;
            if (id === undefined || id === null || typeof id === 'object') {
                id = `row-${index}`;
            }
            normalized.id = id;
            return normalized;
        });
    }, [rawData]);

    // Handle smooth transitions when data or loading state changes (e.g. tab switching)
    const [currentApi, setCurrentApi] = useState(api);
    
    React.useLayoutEffect(() => {
        if (api !== currentApi) {
            // API changed! 
            if (displayData && displayData.length > 0) {
                // If we have old data, show overlay and start transition
                setIsOverlayLoading(true);
                if (gridWrapperRef.current) {
                    setLockHeight(gridWrapperRef.current.offsetHeight);
                }
            } else {
                // No old data, just update immediately
                setCurrentApi(api);
                setDisplayData([]);
            }
        }
    }, [api, currentApi, displayData]);

    React.useLayoutEffect(() => {
        if (!loading && api === currentApi) {
            // We have data for the current API, ensure it's displayed
            setDisplayData(data);
            setIsOverlayLoading(false);
        } else if (!loading && api !== currentApi) {
            // Data arrived for the NEW api
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
    
    // Data arrived or failed
    const setData = useCallback((newData) => {
        if (api && setFetchedData) {
            setFetchedData(newData);
        }
    }, [api, setFetchedData]);



    const handleRowEditStart = (params, event) => {

        event.defaultMuiPrevented = true;
    };

    const handleRowEditStop = (params, event) => {
        event.defaultMuiPrevented = true;
    };

    const handleEditClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    const handleSaveClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };

    const handleDeleteClick = (id) => () => {
        setDeleteId(id);
    };

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });

        const editedRow = data.find((row) => row.id === id);
        if (editedRow.isNew) {
            setData(data.filter((row) => row.id !== id));
        }
    };

    const processRowUpdate = async (newRow) => {
        const isNew = newRow.isNew;
        const dataToSave = { ...newRow };
        delete dataToSave.isNew;

        if (isNew) {
            // For new records, reset the temporary string ID to 0 so the backend can assign a real one
            dataToSave.id = 0;
        }

        try {
            const response = isNew 
                ? await axios.post(`${api}`, dataToSave)
                : await axios.put(`${api}`, dataToSave);
            
            const updatedRow = { ...response.data, isNew: false };
            setData(data.map((row) => (row.id === newRow.id ? updatedRow : row)));
            return updatedRow;
        } catch (err) {
            console.error("Failed to save record", err);
            alert("Failed to save: " + (err.response?.data?.detail || err.message));
            throw err;
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`${api}/${deleteId}`);
            setReload(!reload);
            setDeleteId(null);
        } catch (err) {
            console.error("Failed to delete record", err);
            alert("Failed to delete: " + (err.response?.data?.detail || err.message));
        }
    };

    const addRecord = () => {
        const id = `new-${Math.random().toString(36).substr(2, 9)}`;
        const newRow = { id, isNew: true };
        setData([newRow, ...data]);
        setRowModesModel((oldModel) => ({
            ...oldModel,
            [id]: { mode: GridRowModes.Edit, fieldToFocus: columns[0]?.field },
        }));
    };

    const renderActions = useCallback((id) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        return (
            <Box className={`${styles.rowActions} ${isInEditMode ? styles.active : ''}`}>
                {isInEditMode ? (
                    <>
                        <Tooltip title="Save">
                            <IconButton
                                size="small"
                                onClick={handleSaveClick(id)}
                                className={styles.actionBtn + ' ' + styles.save}
                            >
                                <SaveIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                            <IconButton
                                size="small"
                                onClick={handleCancelClick(id)}
                                className={styles.actionBtn}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <>
                        <Tooltip title="Edit">
                            <IconButton
                                size="small"
                                onClick={handleEditClick(id)}
                                className={styles.actionBtn}
                                disabled={props.editable === false}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton
                                size="small"
                                onClick={handleDeleteClick(id)}
                                className={styles.actionBtn + ' ' + styles.delete}
                                disabled={props.removable === false}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
            </Box>
        );
    }, [rowModesModel, handleSaveClick, handleCancelClick, handleEditClick, handleDeleteClick, props.editable, props.removable]);

    const columns = useMemo(() => {
        let baseColumns = propColumns || parseChildrenToColumns(children, { 
            editable: props.editable, 
            onRowSelected: props.onRowSelected 
        });

        // Ensure columns are editable if the table is editable
        if (props.editable !== false) {
            baseColumns = baseColumns.map(col => {
                const updatedCol = {
                    ...col,
                    editable: col.editable !== false
                };
                
                // If renderCell is provided but renderEditCell is not, use renderCell for editing too
                // This allows components like DropDownCell to handle their own editing state
                if (updatedCol.renderCell && !updatedCol.renderEditCell) {
                    updatedCol.renderEditCell = updatedCol.renderCell;
                }
                
                return updatedCol;
            });
        }

        if (baseColumns.length === 0) return baseColumns;

        // Wrap the last column to include row actions
        const cols = [...baseColumns];
        const lastIndex = cols.length - 1;
        const lastCol = { ...cols[lastIndex] };
        
        const originalRenderCell = lastCol.renderCell;
        lastCol.renderCell = (params) => (
            <Box className={styles.cellWithActions}>
                <Box className={styles.cellContent}>
                    {originalRenderCell ? originalRenderCell(params) : params.value}
                </Box>
                {renderActions(params.id)}
            </Box>
        );

        // Also wrap edit cell to keep actions visible during editing
        const originalRenderEditCell = lastCol.renderEditCell;
        lastCol.renderEditCell = (params) => (
            <Box className={styles.cellWithActions}>
                <Box className={styles.cellContent}>
                    {originalRenderEditCell ? originalRenderEditCell(params) : (originalRenderCell ? originalRenderCell(params) : params.value)}
                </Box>
                {renderActions(params.id)}
            </Box>
        );

        cols[lastIndex] = lastCol;
        return cols;
    }, [children, propColumns, props.editable, props.onRowSelected, renderActions]);


    const currentData = useMemo(() => {
        // During transition (e.g. switching tabs), we keep showing the old data (displayData)
        // until the transition period is over.
        if (isFading || (api !== currentApi && displayData.length > 0)) return displayData;
        
        // In all other cases (including adding a new row), we must use the latest data
        // to stay in sync with rowModesModel and avoid "No row with id" errors.
        return data;
    }, [data, displayData, isFading, api, currentApi]);

    const filteredRows = useMemo(() => {
        if (!currentData) return [];
        if (!searchQuery) return currentData;
        const query = searchQuery.toLowerCase();
        return currentData.filter((row) => 
            Object.values(row).some((val) => 
                String(val).toLowerCase().includes(query)
            )
        );
    }, [currentData, searchQuery]);


    const CustomToolbar = () => (
        <Box className={styles.toolbar}>
            <TextField
                className={styles.searchField}
                placeholder="Search items..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
            />
        </Box>
    );

    return (
        <ParentContext.Provider value={{ itemUpdate: () => setReload(!reload) }}>
            <Box className={styles.tableContainer}>
                {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
                
                <Box className={styles.tableHeader}>
                    <MuiButton
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={addRecord}
                        disabled={!props.editable}
                        sx={{ textTransform: 'none', borderRadius: '4px', px: 2 }}
                    >
                        Add Record
                    </MuiButton>
                </Box>

                {loading && !currentData?.length && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                )}
                
                <Box 
                    ref={gridWrapperRef}
                    className={`${styles.gridWrapper} ${isOverlayLoading ? styles.dimmed : ''}`} 
                    sx={{ 
                        height: filteredRows.length > 0 ? 'auto' : 200, 
                        minHeight: lockHeight > 0 ? `${lockHeight}px` : 200,
                        position: 'relative'
                    }}
                >
                    {isOverlayLoading && (
                        <Box className={styles.loadingOverlay}>
                            <Box className={styles.stickyIndicator}>
                                <CircularProgress size={32} />
                            </Box>
                        </Box>
                    )}
                    <Fade in={!isFading} timeout={200}>
                        <Box sx={{ height: '100%' }}>
                            <DataGrid
                                rows={filteredRows}
                                columns={columns}
                                editMode="row"
                                density="compact"
                                rowModesModel={rowModesModel}
                                onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
                                onRowEditStart={handleRowEditStart}
                                onRowEditStop={handleRowEditStop}
                                processRowUpdate={processRowUpdate}
                                onProcessRowUpdateError={(err) => console.error("Error processing row update:", err)}
                                onRowSelectionModelChange={(newSelectionModel) => {
                                    if (props.onRowSelected && newSelectionModel.length > 0) {
                                        const selectedRow = currentData.find(r => r.id === newSelectionModel[0]);
                                        if (selectedRow) props.onRowSelected(selectedRow);
                                    }
                                }}
                                slots={{
                                    toolbar: CustomToolbar,
                                }}
                                hideFooter={filteredRows.length < 10}
                                autoHeight={filteredRows.length < 15}
                            />
                        </Box>
                    </Fade>
                </Box>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteId !== null}
                    onClose={() => setDeleteId(null)}
                >
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete this record? This action cannot be undone.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <MuiButton onClick={() => setDeleteId(null)}>Cancel</MuiButton>
                        <MuiButton onClick={confirmDelete} color="error" variant="contained" autoFocus>
                            Delete
                        </MuiButton>
                    </DialogActions>
                </Dialog>
            </Box>
        </ParentContext.Provider>
    );
}


RelationTable.propTypes = {
    api: PropTypes.string,
    children: PropTypes.node,
    columns: PropTypes.array,
    data: PropTypes.array,
    editable: PropTypes.bool,
    removable: PropTypes.bool,
    onRowSelected: PropTypes.func
};


RelationTable.defaultProps = {
    editable: true,
    removable: true,
};
