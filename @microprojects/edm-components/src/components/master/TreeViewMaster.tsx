import React, {useState, useEffect, useMemo} from 'react';
import {useHistory, useRouteMatch, useParams} from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Search as SearchIcon,
    CreateNewFolder as CreateFolderIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import {RichTreeView} from '@mui/x-tree-view/RichTreeView';
import {TreeItem} from '@mui/x-tree-view/TreeItem';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import axios from 'axios';
import {useGet} from '../../hooks/useGet';
import {
    transformData,
    findNode,
    findNodePath,
    getAllFolderIds,
    collectItemsWithChildren,
    checkMoveValidity,
    getEntityType,
    getIconForType,
    DEFAULT_ENTITY_TYPE_MAP,
    DEFAULT_ICON_MAP,
    TreeNode,
} from './treeUtils';
import styles from './TreeViewMaster.module.scss';

/* HANDOFF · imperative-handle pattern preserved verbatim from Tech.
   Module-level mutation lets callers force a fetch via `refresh()` from
   anywhere. Refactor candidate for Phase 2 (move to context-based ref). */
let _render: number;
let _renderFunc: ((next: number) => void) | undefined;

interface IndustrialTreeItemProps {
    itemId: string;
    label: React.ReactNode;
    isNode?: boolean;
    apiPath?: string;
    itemsWithChildren?: Set<string>;
    expandedSet?: Set<string>;
    selectedId?: string | null;
    activeNode?: TreeNode | null;
    treeData?: TreeNode[];
    entityTypeMap?: Array<{urlPrefix: string; entityType: string}>;
    iconMap?: Record<string, React.ComponentType<any>>;
}

// Custom Tree Item with D&D integration
const IndustrialTreeItem = React.forwardRef<HTMLLIElement, IndustrialTreeItemProps>((props, ref) => {
    const {
        itemId, label, isNode, apiPath,
        itemsWithChildren, expandedSet, selectedId,
        activeNode, treeData, entityTypeMap, iconMap,
        ...treeItemProps
    } = props;

    // Fallback detection if RichTreeView doesn't spread item properties
    const itemIsNode = isNode ?? itemId?.startsWith('node-');
    const hasChildren = itemsWithChildren?.has(itemId) ?? false;
    const isEmptyFolder = itemIsNode && !hasChildren;
    const isExpanded = expandedSet?.has(itemId) ?? false;
    const isSelected = selectedId === itemId;

    const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
        id: itemId,
        data: {id: itemId, label, isNode: itemIsNode},
    });

    const {setNodeRef: setDropRef, isOver} = useDroppable({
        id: itemId,
        data: {id: itemId, label, isNode: itemIsNode},
    });

    /* Drop-target visual state per v2 04d.7. */
    const dropValidity = useMemo(() => {
        if (!isOver || !activeNode || !treeData) return null;
        const targetNode = findNode(treeData, itemId);
        return checkMoveValidity(activeNode, targetNode);
    }, [isOver, activeNode, treeData, itemId]);

    const style: React.CSSProperties = {
        opacity: isDragging ? 0.4 : 1,
    };

    const handleRef = (node: HTMLLIElement | null) => {
        setNodeRef(node);
        setDropRef(node);
        if (ref) {
            if (typeof ref === 'function') ref(node);
            else (ref as any).current = node;
        }
    };

    // Empty folders always render the closed icon — there is nothing to expand into.
    const showOpenFolder = itemIsNode && hasChildren && isExpanded;
    const IconComponent = getIconForType(apiPath || '', itemIsNode, showOpenFolder, entityTypeMap, iconMap);

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

    const IconContainerSlot = useMemo(() => {
        const Slot = (slotProps: any) => {
            const {onClick: muiOnClick, style: muiStyle, ...rest} = slotProps;
            const handleClick = (e: React.MouseEvent) => {
                muiOnClick?.(e);
                if (itemIsNode) {
                    e.stopPropagation();
                }
            };
            return (
                <div
                    {...rest}
                    onClick={handleClick}
                    style={{...muiStyle, cursor: iconCursor}}
                />
            );
        };
        return Slot;
    }, [itemIsNode, iconCursor]);

    const dropClass = dropValidity === 'valid'
        ? styles.dropInto
        : dropValidity === 'invalid'
            ? styles.dropForbid
            : '';

    return (
        <TreeItem
            {...(treeItemProps as any)}
            itemId={itemId}
            label={label}
            ref={handleRef as any}
            style={style}
            {...attributes}
            {...listeners}
            className={`${itemClass} ${isSelected ? styles.selectedItem : ''} ${dropClass}`}
            slots={{
                icon: IconComponent,
                iconContainer: IconContainerSlot,
            }}
        />
    );
});
IndustrialTreeItem.displayName = 'IndustrialTreeItem';

export {IndustrialTreeItem};

export interface TreeViewMasterProps {
    /** Data API root — `${api}/hierarchy` is fetched on mount. */
    api: string;
    /** Hierarchies API root — used by drag-and-drop folder moves (PUT to `${hierarchiesApi}/{id}/parent`). */
    hierarchiesApi?: string;
    /** Notify the parent when the active item changes (used by MasterDetail to bind editor save). */
    onCurrentRootChanged?: (node: TreeNode) => void;
    /** Override URL-prefix → entity-type detection (default = Tech's mapping). */
    entityTypeMap?: Array<{urlPrefix: string; entityType: string}>;
    /** Override entity-type → icon component map (default = Tech's mapping). */
    iconMap?: Record<string, React.ComponentType<any>>;
}

export function TreeViewMaster(props: TreeViewMasterProps) {
    const {
        api: apiPath,
        hierarchiesApi,
        onCurrentRootChanged,
        entityTypeMap = DEFAULT_ENTITY_TYPE_MAP,
        iconMap = DEFAULT_ICON_MAP,
    } = props;
    const [render, setRender] = useState(0);
    _render = render;
    _renderFunc = setRender;
    const history = useHistory();
    const {url} = useRouteMatch();
    const {id: routeId} = useParams<{id?: string}>();

    const [[data], loading, error] = useGet(`${apiPath}/hierarchy`, [render]);
    const [filter, setFilter] = useState('');
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    const treeData = useMemo(() => transformData(data) || [], [data]);
    const itemsWithChildren = useMemo(() => collectItemsWithChildren(treeData), [treeData]);
    const expandedSet = useMemo(() => new Set(expandedItems), [expandedItems]);

    // Handle initial expand all and auto-expansion when route changes
    useEffect(() => {
        if (treeData && treeData.length > 0) {
            setExpandedItems((currentExpanded) => {
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

                if (JSON.stringify(newExpanded) === JSON.stringify(currentExpanded)) {
                    return currentExpanded;
                }
                return newExpanded;
            });

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
        const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.reduce<TreeNode[]>((acc, node) => {
                const match = node.label.toLowerCase().includes(filter.toLowerCase());
                const filteredChildren = node.children ? filterNodes(node.children) : [];
                if (match || filteredChildren.length > 0) {
                    acc.push({...node, children: filteredChildren});
                }
                return acc;
            }, []);
        };
        return filterNodes(treeData);
    }, [treeData, filter]);

    const handleItemSelectionChange = (_event: any, itemId: string | null) => {
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

    const handleExpandedItemsChange = (_event: any, itemIds: string[]) => {
        setExpandedItems(itemIds);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: any) => {
        const {active, over} = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const draggedNode = findNode(treeData, active.id);
        const targetNode = findNode(treeData, over.id);
        if (!draggedNode || !targetNode) return;

        if (checkMoveValidity(draggedNode, targetNode) !== 'valid') return;

        const targetNumericParentId = targetNode.isNode
            ? targetNode.numericId
            : targetNode.parentId;

        try {
            const link = draggedNode.isNode ? hierarchiesApi : apiPath;
            if (!link) {
                console.warn('TreeViewMaster: cannot move folder without `hierarchiesApi` prop set.');
                return;
            }
            await axios.put(`${link}/${draggedNode.numericId}/parent`, {id: parseInt(targetNumericParentId, 10)});
            setRender((r) => r + 1);
        } catch (err: any) {
            console.error('Failed to move item', err);
            alert('Failed to move item: ' + (err.response?.data?.detail || err.message));
        }
    };

    const activeNode = useMemo(
        () => activeId ? findNode(treeData, activeId) : null,
        [activeId, treeData]
    );

    const entityType = useMemo(() => getEntityType(apiPath, entityTypeMap), [apiPath, entityTypeMap]);

    return (
        <Box className={`${styles.masterContainer} ${entityType ? (styles as any)[entityType] || '' : ''}`}>
            <Box className={styles.header}>
                <TextField
                    className={styles.searchField}
                    placeholder="Search..."
                    variant="outlined"
                    size="small"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{mr: 1, color: 'text.secondary'}} />,
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
                    <Box sx={{p: 2}}><Alert severity="error">{error}</Alert></Box>
                ) : loading && !data ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}><CircularProgress size={32} /></Box>
                ) : (
                    <DndContext
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <RichTreeView
                            items={filteredData as any}
                            expandedItems={expandedItems}
                            onExpandedItemsChange={handleExpandedItemsChange as any}
                            onItemSelectionToggle={handleItemSelectionChange as any}
                            selectedItems={currentSelectedId as any}
                            expansionTrigger="iconContainer"
                            slots={{
                                item: IndustrialTreeItem as any,
                            }}
                            slotProps={{
                                item: {
                                    apiPath,
                                    itemsWithChildren,
                                    expandedSet,
                                    selectedId: currentSelectedId,
                                    activeNode,
                                    treeData,
                                    entityTypeMap,
                                    iconMap,
                                } as any,
                            }}
                        />
                        <DragOverlay dropAnimation={null}>
                            {activeId ? (() => {
                                const dragged = findNode(treeData, activeId);
                                const isNode = dragged?.isNode;
                                const DragIcon = getIconForType(apiPath, !!isNode, false, entityTypeMap, iconMap);
                                return (
                                    <Box className={styles.dragGhost}>
                                        <DragIcon
                                            fontSize="small"
                                            sx={{
                                                mr: 1,
                                                color: isNode ? 'var(--accent)' : 'var(--ink-3)',
                                            }}
                                        />
                                        <Typography variant="body2" sx={{fontWeight: isNode ? 600 : 400, fontSize: '14px'}}>
                                            {dragged?.label}
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

export function refresh() {
    if (_renderFunc) _renderFunc((_render ?? 0) + 1);
}
