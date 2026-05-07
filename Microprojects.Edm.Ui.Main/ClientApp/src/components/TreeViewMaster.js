import React, { useState, useEffect, useMemo } from 'react';
import { useHistory, useRouteMatch, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
    Box, 
    Typography, 
    TextField, 
    IconButton, 
    Tooltip, 
    CircularProgress, 
    Alert
} from '@mui/material';
import {
    Search as SearchIcon,
    CreateNewFolder as CreateFolderIcon,
    Add as AddIcon,
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
    InsertDriveFile as FileIcon,
    AccountTree as AccountTreeIcon,
    Business as BusinessIcon,
    Dns as DnsIcon,
    Memory as MemoryIcon,
    PlayCircleOutline as OperationIcon,
    FactCheck as AuditIcon,
    Description as ProfileIcon,
    SettingsInputComponent as DriverIcon,
    Extension as ExtensionIcon,
    Handyman as WorkbenchIcon
} from '@mui/icons-material';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { 
    DndContext, 
    DragOverlay, 
    PointerSensor, 
    useSensor, 
    useSensors
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useGet } from './hooks/hooks';
import axios from 'axios';
import api from './api';
import styles from './TreeViewMaster.module.scss';

// Utility to transform EDM data to MUI RichTreeView format
const transformData = (nodes, parentId = 0) => {
    if (!nodes || nodes.length === 0) return undefined;
    return nodes.map(node => ({
        id: `${node.isNode ? 'node' : 'item'}-${node.id}`,
        numericId: node.id.toString(),
        label: node.name,
        isNode: node.isNode,
        parentId: parentId.toString(),
        children: transformData(node.items, node.id)
    })).sort((a, b) => a.label.localeCompare(b.label));
};

// Find node path for auto-expansion
const findNodePath = (nodes, targetNumericId, path = []) => {
    for (const node of nodes) {
        const currentPath = [...path, node.id];
        if (node.numericId === targetNumericId) return path; 
        if (node.children) {
            const found = findNodePath(node.children, targetNumericId, currentPath);
            if (found) return found;
        }
    }
    return null;
};

// Flatten tree to find a specific node by prefixed ID or numeric ID
const findNode = (nodes, id, useNumeric = false) => {
    if (!nodes) return null;
    for (const node of nodes) {
        if (useNumeric ? node.numericId === id : node.id === id) return node;
        if (node.children) {
            const found = findNode(node.children, id, useNumeric);
            if (found) return found;
        }
    }
    return null;
};

// Get all folder IDs
const getAllFolderIds = (nodes, ids = []) => {
    if (!nodes) return ids;
    for (const node of nodes) {
        if (node.isNode) {
            ids.push(node.id);
            if (node.children) {
                getAllFolderIds(node.children, ids);
            }
        }
    }
    return ids;
};

const collectItemsWithChildren = (nodes, set = new Set()) => {
    if (!nodes) return set;
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            set.add(node.id);
            collectItemsWithChildren(node.children, set);
        }
    }
    return set;
};

const getEntityType = (apiPath) => {
    if (apiPath.includes('/api/processes')) return 'process';
    if (apiPath.includes('/api/devices')) return 'device';
    if (apiPath.includes('/api/hosts')) return 'host';
    if (apiPath.includes('workbenches')) return 'workbench';
    if (apiPath.includes('/api/workplaces')) return 'workplace';
    if (apiPath.includes('/api/operations')) return 'operation';
    if (apiPath.includes('/api/audits')) return 'audit';
    if (apiPath.includes('/api/profiles')) return 'profile';
    if (apiPath.includes('/api/plugins/drivers')) return 'driver';
    if (apiPath.includes('/api/plugins/profiles')) return 'profile';
    if (apiPath.includes('/api/plugins/operations')) return 'plugin';
    return '';
};

const getIconForType = (apiPath, isNode, isExpanded) => {
    if (isNode) {
        return isExpanded ? FolderOpenIcon : FolderIcon;
    }

    const type = getEntityType(apiPath);
    switch (type) {
        case 'process': return AccountTreeIcon;
        case 'device': return MemoryIcon;
        case 'host': return DnsIcon;
        case 'workplace': return BusinessIcon;
        case 'workbench': return WorkbenchIcon;
        case 'operation': return OperationIcon;
        case 'audit': return AuditIcon;
        case 'profile': return ProfileIcon;
        case 'driver': return DriverIcon;
        case 'plugin': return ExtensionIcon;
        default: return FileIcon;
    }
};

// Custom Tree Item with D&D integration
const IndustrialTreeItem = React.forwardRef((props, ref) => {
    const { itemId, label, isNode, apiPath, itemsWithChildren, expandedSet, selectedId } = props;

    // Fallback detection if RichTreeView doesn't spread item properties
    const itemIsNode = isNode ?? itemId?.startsWith('node-');
    const hasChildren = itemsWithChildren?.has(itemId) ?? false;
    const isEmptyFolder = itemIsNode && !hasChildren;
    const isExpanded = expandedSet?.has(itemId) ?? false;
    const isSelected = selectedId === itemId;

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: itemId,
        data: { id: itemId, label, isNode: itemIsNode }
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: itemId,
        data: { id: itemId, label, isNode: itemIsNode }
    });

    const style = {
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: isOver ? 'rgba(25, 118, 210, 0.08)' : undefined,
    };

    const handleRef = (node) => {
        setNodeRef(node);
        setDropRef(node);
        if (ref) {
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        }
    };

    // Empty folders always render the closed icon — there is nothing to expand into.
    const showOpenFolder = itemIsNode && hasChildren && isExpanded;
    const IconComponent = getIconForType(apiPath || '', itemIsNode, showOpenFolder);

    const itemClass = itemIsNode
        ? (isEmptyFolder ? styles.emptyFolderItem : styles.folderItem)
        : styles.fileItem;

    const iconCursor = !itemIsNode
        ? 'pointer'
        : isEmptyFolder
            ? 'default'
            : isExpanded
                ? 'zoom-out'
                : 'zoom-in';

    // Wrap iconContainer so a folder's icon click toggles expansion (MUI's onClick) but
    // does NOT bubble to content selection — i.e. the URL/selected node stays put.
    const IconContainerSlot = useMemo(() => {
        const Slot = (slotProps) => {
            const { onClick: muiOnClick, style: muiStyle, ...rest } = slotProps;
            const handleClick = (e) => {
                muiOnClick?.(e);
                if (itemIsNode) {
                    e.stopPropagation();
                }
            };
            return (
                <div
                    {...rest}
                    onClick={handleClick}
                    style={{ ...muiStyle, cursor: iconCursor }}
                />
            );
        };
        return Slot;
    }, [itemIsNode, iconCursor]);

    return (
        <TreeItem
            {...props}
            ref={handleRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${itemClass} ${isSelected ? styles.selectedItem : ''}`}
            slots={{
                icon: IconComponent,
                iconContainer: IconContainerSlot
            }}
        />
    );
});

export function TreeViewMaster(props) {
    const { api: apiPath, onCurrentRootChanged } = props;
    const [render, setRender] = useState(0);
    _render = render;
    _renderFunc = setRender;
    const history = useHistory();
    const { url } = useRouteMatch();
    const { id: routeId } = useParams();
    
    const [[data], loading, error] = useGet(`${apiPath}/hierarchy`, [render]);
    const [filter, setFilter] = useState('');
    const [expandedItems, setExpandedItems] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [initialized, setInitialized] = useState(false);

    const treeData = useMemo(() => transformData(data), [data]);
    const itemsWithChildren = useMemo(() => collectItemsWithChildren(treeData || []), [treeData]);
    const expandedSet = useMemo(() => new Set(expandedItems), [expandedItems]);

    // Handle initial expand all and auto-expansion when route changes
    useEffect(() => {
        if (treeData && treeData.length > 0) {
            setExpandedItems(currentExpanded => {
                let newExpanded = [...currentExpanded];
                
                // Expand all folders initially
                if (!initialized) {
                    newExpanded = getAllFolderIds(treeData);
                    setInitialized(true);
                }

                // Expand path to current item if navigating via URL
                if (routeId) {
                    const path = findNodePath(treeData, routeId.toString());
                    if (path) {
                        newExpanded = Array.from(new Set([...newExpanded, ...path]));
                    }
                }

                // Optimization: only update if changed
                if (JSON.stringify(newExpanded) === JSON.stringify(currentExpanded)) {
                    return currentExpanded;
                }
                return newExpanded;
            });

            // Notify parent about the current item (side effect, stay outside setExpandedItems)
            if (routeId) {
                const node = findNode(treeData, routeId.toString(), true);
                if (node && onCurrentRootChanged) {
                    onCurrentRootChanged(node);
                }
            }
        }
    }, [routeId, treeData, onCurrentRootChanged, initialized]);

    const currentSelectedId = useMemo(() => {
        if (!routeId || !treeData || treeData.length === 0) return null;
        const node = findNode(treeData, routeId.toString(), true);
        return node ? node.id : null;
    }, [routeId, treeData]);

    const filteredData = useMemo(() => {
        if (!filter) return treeData;
        const filterNodes = (nodes) => {
            return nodes.reduce((acc, node) => {
                const match = node.label.toLowerCase().includes(filter.toLowerCase());
                const filteredChildren = node.children ? filterNodes(node.children) : [];
                if (match || filteredChildren.length > 0) {
                    acc.push({ ...node, children: filteredChildren });
                }
                return acc;
            }, []);
        };
        return filterNodes(treeData);
    }, [treeData, filter]);

    const handleItemSelectionChange = (event, itemId) => {
        if (!itemId) return;
        const node = findNode(treeData, itemId);
        if (!node) return;

        onCurrentRootChanged && onCurrentRootChanged(node);

        if (node.isNode) {
            history.push(`${url}/folder/${node.numericId}`);
        } else {
            history.push(`${url}/${node.numericId}`);
        }
    };

    const handleExpandedItemsChange = (event, itemIds) => {
        setExpandedItems(itemIds);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const draggedNode = findNode(treeData, active.id);
        const targetNode = findNode(treeData, over.id);

        if (!draggedNode || !targetNode) return;

        // "Move-to-Folder" Logic:
        // If target is a folder, move into it.
        // If target is a file, move into its parent folder.
        let targetNumericParentId = targetNode.isNode ? targetNode.numericId : targetNode.parentId;

        // Prevent moving a folder into its own children or itself
        const isDescendant = (parent, targetId) => {
            if (parent.children) {
                for (const child of parent.children) {
                    if (child.id === targetId) return true;
                    if (isDescendant(child, targetId)) return true;
                }
            }
            return false;
        };

        const targetPrefixedId = targetNode.isNode ? targetNode.id : `node-${targetNode.parentId}`;
        if (targetNumericParentId === draggedNode.numericId || isDescendant(draggedNode, targetPrefixedId)) {
            console.warn("Invalid move");
            return;
        }

        try {
            const link = draggedNode.isNode ? api.hierarchies : apiPath;
            await axios.put(`${link}/${draggedNode.numericId}/parent`, { id: parseInt(targetNumericParentId) });
            setRender(r => r + 1); 
        } catch (err) {
            console.error("Failed to move item", err);
            alert("Failed to move item: " + (err.response?.data?.detail || err.message));
        }
    };

    const entityType = useMemo(() => getEntityType(apiPath), [apiPath]);

    return (
        <Box className={`${styles.masterContainer} ${entityType ? styles[entityType] : ''}`}>
            <Box className={styles.header}>
                <TextField
                    className={styles.searchField}
                    placeholder="Search..."
                    variant="outlined"
                    size="small"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                />
                <Tooltip title="Add Folder">
                    <IconButton className={styles.actionBtn} onClick={() => history.push(`${url}/folder/0`)}>
                        <CreateFolderIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Add Item">
                    <IconButton className={styles.actionBtn} onClick={() => history.push(`${url}/0`)}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box className={styles.treeBody}>
                {error ? (
                    <Box sx={{ p: 2 }}><Alert severity="error">{error}</Alert></Box>
                ) : loading && !data ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={32} /></Box>
                ) : (
                    <DndContext 
                        sensors={sensors} 
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <RichTreeView
                            items={filteredData}
                            expandedItems={expandedItems}
                            onExpandedItemsChange={handleExpandedItemsChange}
                            onItemSelectionToggle={handleItemSelectionChange}
                            selectedItems={currentSelectedId}
                            expansionTrigger="iconContainer"
                            slots={{
                                item: IndustrialTreeItem
                            }}
                            slotProps={{
                                item: {
                                    apiPath: apiPath,
                                    itemsWithChildren: itemsWithChildren,
                                    expandedSet: expandedSet,
                                    selectedId: currentSelectedId
                                }
                            }}
                        />
                        <DragOverlay dropAnimation={null}>
                            {activeId ? (() => {
                                const activeNode = findNode(treeData, activeId);
                                const isNode = activeNode?.isNode;
                                const DragIcon = getIconForType(apiPath, isNode, false);
                                return (
                                    <Box className={styles.dragGhost}>
                                        <DragIcon 
                                            fontSize="small" 
                                            sx={{ 
                                                mr: 1, 
                                                color: isNode ? '#ffa726' : '#757575' 
                                            }} 
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: isNode ? 600 : 400, fontSize: '14px' }}>
                                            {activeNode?.label}
                                        </Typography>
                                    </Box>
                                );
                            })() : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </Box>
        </Box>
    );
}

TreeViewMaster.propTypes = {
    api: PropTypes.string,
    onCurrentRootChanged: PropTypes.func,
    item: PropTypes.func
};

let _render, _renderFunc;

export function refresh() {
    _renderFunc && _renderFunc(++_render);
}

