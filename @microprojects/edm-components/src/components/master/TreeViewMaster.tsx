import React, {useState, useEffect, useMemo} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useBasePath} from '../../hooks/useBasePath';
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
    collectDescriptions,
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
    isFolder?: boolean;
    apiPath?: string;
    itemsWithChildren?: Set<string>;
    expandedSet?: Set<string>;
    selectedId?: string | null;
    activeNode?: TreeNode | null;
    treeData?: TreeNode[];
    entityTypeMap?: Array<{urlPrefix: string; entityType: string}>;
    iconMap?: Record<string, React.ComponentType<any>>;
    descriptionMap?: Map<string, string>;
    entityType?: string;
}

// Custom Tree Item with D&D integration
const IndustrialTreeItem = React.forwardRef<HTMLLIElement, IndustrialTreeItemProps>((props, ref) => {
    const {
        itemId, label, isFolder, apiPath,
        itemsWithChildren, expandedSet, selectedId,
        activeNode, treeData, entityTypeMap, iconMap,
        descriptionMap, entityType: entityTypeOverride,
        ...treeItemProps
    } = props;

    // Native browser tooltip — exposes the full name when the row gets clipped
    // (resizable master pane), and surfaces the description when present.
    const labelText = typeof label === 'string' ? label : '';
    const description = descriptionMap?.get(itemId);
    const tooltip = description && description !== labelText
        ? `${labelText} — ${description}`
        : labelText;
    const labelNode = typeof label === 'string'
        ? <span title={tooltip} className={styles.labelText}>{label}</span>
        : label;

    // Fallback detection if RichTreeView doesn't spread item properties
    const itemIsFolder = isFolder ?? itemId?.startsWith('folder-');
    const hasChildren = itemsWithChildren?.has(itemId) ?? false;
    const isEmptyFolder = itemIsFolder && !hasChildren;
    const isExpanded = expandedSet?.has(itemId) ?? false;
    const isSelected = selectedId === itemId;

    const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
        id: itemId,
        data: {id: itemId, label, isFolder: itemIsFolder},
    });

    const {setNodeRef: setDropRef, isOver} = useDroppable({
        id: itemId,
        data: {id: itemId, label, isFolder: itemIsFolder},
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
    const showOpenFolder = itemIsFolder && hasChildren && isExpanded;
    const IconComponent = getIconForType(apiPath || '', itemIsFolder, showOpenFolder, entityTypeMap, iconMap);

    const itemClass = itemIsFolder
        ? (isEmptyFolder ? styles.emptyFolderItem : styles.folderItem)
        : styles.fileItem;

    // Resolve icon colour against the consumer's entity-color tokens; folders take the universal folder hue, empty folders stay muted, leaves take their entity hue. Explicit `entityType` prop wins over URL-prefix detection so per-instance overrides (e.g. process kinds sharing the same URL) work.
    const entityType = entityTypeOverride ?? getEntityType(apiPath, entityTypeMap);
    const iconColor = itemIsFolder
        ? (isEmptyFolder ? 'var(--ink-4)' : 'var(--ent-folder-deep)')
        : entityType
            ? `var(--ent-${entityType}-deep)`
            : 'var(--ink-3)';

    const iconCursor = !itemIsFolder
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
                if (itemIsFolder) {
                    e.stopPropagation();
                }
            };
            return (
                <div
                    {...rest}
                    onClick={handleClick}
                    style={{...muiStyle, cursor: iconCursor, color: iconColor}}
                />
            );
        };
        return Slot;
    }, [itemIsFolder, iconCursor, iconColor]);

    const dropClass = dropValidity === 'valid'
        ? styles.dropInto
        : dropValidity === 'invalid'
            ? styles.dropForbid
            : '';

    return (
        <TreeItem
            {...(treeItemProps as any)}
            itemId={itemId}
            label={labelNode}
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
    /** External signal that bumps when the tree should refetch (typically a value
     *  from `useEntityToken`). Included in the GET dep array. */
    refreshToken?: unknown;
    /** Fired with the first raw API node after data loads. Lets the parent
     *  hold "the tree's root" for parent-id resolution on new-item creation. */
    onRootLoaded?: (rootNode: any) => void;
    /** Builds query-string params appended to `${api}/hierarchy`. */
    getHierarchyQuery?: () => Record<string, string | undefined>;
    /** When true, if the API returns a single root with children, those children
     *  are rendered at the top level instead of the root itself. Logistics-style
     *  hidden-root layout. Default: false. */
    unwrapSingleRoot?: boolean;
    /** Explicit entity type override — used when multiple kinds share one API URL
     *  (e.g. Logistics's three process kinds) and URL-prefix detection isn't enough.
     *  Takes precedence over `entityTypeMap` lookup. */
    entityType?: string;
}

function buildHierarchyUrl(base: string, query?: Record<string, string | undefined>): string {
    if (!query) return base;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
        if (v != null && v !== '') params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
}

export function TreeViewMaster(props: TreeViewMasterProps) {
    const {
        api: apiPath,
        hierarchiesApi,
        onCurrentRootChanged,
        onRootLoaded,
        getHierarchyQuery,
        refreshToken,
        unwrapSingleRoot = false,
        entityTypeMap = DEFAULT_ENTITY_TYPE_MAP,
        iconMap = DEFAULT_ICON_MAP,
        entityType: entityTypeOverride,
    } = props;
    const [render, setRender] = useState(0);
    _render = render;
    _renderFunc = setRender;
    const navigate = useNavigate();
    const url = useBasePath();
    const {id: routeId} = useParams<{id?: string}>();

    const hierarchyUrl = buildHierarchyUrl(`${apiPath}/hierarchy`, getHierarchyQuery?.());
    const [[data], loading, error] = useGet(hierarchyUrl, [render, refreshToken]);
    const [filter, setFilter] = useState('');
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    // Notify the parent of the root node once per data load. The parent uses
    // this to seed parentId fallbacks when creating new items at the root.
    useEffect(() => {
        if (data && Array.isArray(data) && data.length > 0) {
            onRootLoaded?.(data[0]);
        }
    }, [data, onRootLoaded]);

    // Hidden-root unwrap: when the API wraps every child under a single root
    // folder (Logistics convention), render that root's children at the top
    // level so the tree starts at the meaningful nodes.
    const rawData = useMemo(() => {
        if (!unwrapSingleRoot || !data || !Array.isArray(data) || data.length !== 1) return data;
        const single = data[0];
        return single?.items ?? data;
    }, [data, unwrapSingleRoot]);

    const treeData = useMemo(() => transformData(rawData) || [], [rawData]);
    const itemsWithChildren = useMemo(() => collectItemsWithChildren(treeData), [treeData]);
    const descriptionMap = useMemo(() => collectDescriptions(treeData), [treeData]);
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

        if (node.isFolder) {
            navigate(`${url}/folder/${node.numericId}`);
        } else {
            navigate(`${url}/${node.numericId}`);
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

        const targetNumericParentId = targetNode.isFolder
            ? targetNode.numericId
            : targetNode.parentId;

        try {
            const link = draggedNode.isFolder ? hierarchiesApi : apiPath;
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

    const masterEntityType = useMemo(
        () => entityTypeOverride ?? getEntityType(apiPath, entityTypeMap),
        [entityTypeOverride, apiPath, entityTypeMap],
    );
    const masterColorStyle = masterEntityType
        ? ({'--entity-color': `var(--ent-${masterEntityType}-deep)`} as React.CSSProperties)
        : undefined;

    return (
        <Box className={styles.masterContainer} style={masterColorStyle}>
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
                    <IconButton className={styles.actionBtn} onClick={() => navigate(`${url}/folder/0`)}>
                        <CreateFolderIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Add Item">
                    <IconButton className={styles.actionBtn} onClick={() => navigate(`${url}/0`)}>
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
                                    descriptionMap,
                                    entityType: entityTypeOverride,
                                } as any,
                            }}
                        />
                        <DragOverlay dropAnimation={null}>
                            {activeId ? (() => {
                                const dragged = findNode(treeData, activeId);
                                const isFolder = dragged?.isFolder;
                                const DragIcon = getIconForType(apiPath, !!isFolder, false, entityTypeMap, iconMap);
                                return (
                                    <Box className={styles.dragGhost}>
                                        <DragIcon
                                            fontSize="small"
                                            sx={{
                                                mr: 1,
                                                color: isFolder ? 'var(--accent)' : 'var(--ink-3)',
                                            }}
                                        />
                                        <Typography variant="body2" sx={{fontWeight: isFolder ? 600 : 400, fontSize: '14px'}}>
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
