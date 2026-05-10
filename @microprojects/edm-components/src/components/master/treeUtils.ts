import {
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
    Handyman as WorkbenchIcon,
} from '@mui/icons-material';

export interface TreeNode {
    id: string;
    numericId: string;
    label: string;
    isNode: boolean;
    parentId: string;
    description?: string;
    children?: TreeNode[];
}

export interface RawTreeNode {
    id: number | string;
    name: string;
    description?: string;
    isNode?: boolean;
    items?: RawTreeNode[];
}

// Utility to transform EDM data to MUI RichTreeView format
export const transformData = (nodes: RawTreeNode[] | undefined, parentId: number | string = 0): TreeNode[] | undefined => {
    if (!nodes || nodes.length === 0) return undefined;
    return nodes.map((node) => ({
        id: `${node.isNode ? 'node' : 'item'}-${node.id}`,
        numericId: node.id.toString(),
        label: node.name,
        isNode: !!node.isNode,
        parentId: parentId.toString(),
        description: node.description,
        children: transformData(node.items, node.id),
    })).sort((a, b) => a.label.localeCompare(b.label));
};

// Flatten the tree into an itemId → description map. Used by the tree-item
// slot to render a native browser tooltip when the row name is clipped.
export const collectDescriptions = (nodes: TreeNode[] | undefined, map: Map<string, string> = new Map()): Map<string, string> => {
    if (!nodes) return map;
    for (const node of nodes) {
        if (node.description) map.set(node.id, node.description);
        if (node.children) collectDescriptions(node.children, map);
    }
    return map;
};

// Find node path for auto-expansion
export const findNodePath = (nodes: TreeNode[], targetNumericId: string, path: string[] = []): string[] | null => {
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
export const findNode = (nodes: TreeNode[] | undefined, id: string, useNumeric = false): TreeNode | null => {
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
export const getAllFolderIds = (nodes: TreeNode[] | undefined, ids: string[] = []): string[] => {
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

export const collectItemsWithChildren = (nodes: TreeNode[] | undefined, set: Set<string> = new Set()): Set<string> => {
    if (!nodes) return set;
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            set.add(node.id);
            collectItemsWithChildren(node.children, set);
        }
    }
    return set;
};

// Drop-target validity for v2 04d.7. Returns 'valid' (drop allowed —
// renders as `into`) or 'invalid' (renders as `forbidden`). Shared
// between the item slot (visual feedback) and handleDragEnd (write
// guard) so the two can never disagree.
export const checkMoveValidity = (draggedNode: TreeNode | null, targetNode: TreeNode | null): 'valid' | 'invalid' | null => {
    if (!draggedNode || !targetNode) return null;
    if (draggedNode.id === targetNode.id) return 'invalid';

    /* Where the move would actually land:
       - target is a folder -> into that folder
       - target is a leaf   -> next to the leaf, i.e. into its parent  */
    const targetParentNumericId = targetNode.isNode
        ? targetNode.numericId
        : targetNode.parentId;
    const targetParentPrefixedId = targetNode.isNode
        ? targetNode.id
        : `node-${targetNode.parentId}`;

    /* Folder dropped into itself. */
    if (targetParentNumericId === draggedNode.numericId) return 'invalid';

    /* Folder dropped into one of its descendants. */
    const isDescendant = (parent: TreeNode, targetId: string): boolean => {
        if (!parent.children) return false;
        for (const child of parent.children) {
            if (child.id === targetId) return true;
            if (isDescendant(child, targetId)) return true;
        }
        return false;
    };
    if (isDescendant(draggedNode, targetParentPrefixedId)) return 'invalid';

    return 'valid';
};

/* Default URL-prefix → entity-type mapping (the EDM Technologies plugin's set).
   Plugins can override via TreeViewMaster's `entityTypeMap` prop. */
export const DEFAULT_ENTITY_TYPE_MAP: Array<{urlPrefix: string; entityType: string}> = [
    {urlPrefix: '/plugins/drivers',    entityType: 'driver'},
    {urlPrefix: '/plugins/profiles',   entityType: 'profile'},
    {urlPrefix: '/plugins/operations', entityType: 'plugin'},
    {urlPrefix: '/processes',          entityType: 'process'},
    {urlPrefix: '/devices',            entityType: 'device'},
    {urlPrefix: '/hosts',              entityType: 'host'},
    {urlPrefix: '/workbenches',        entityType: 'workbench'},
    {urlPrefix: '/workplaces',         entityType: 'workplace'},
    {urlPrefix: '/operations',         entityType: 'operation'},
    {urlPrefix: '/audits',             entityType: 'audit'},
    {urlPrefix: '/profiles',           entityType: 'profile'},
];

export const getEntityType = (apiPath: string | undefined, map: Array<{urlPrefix: string; entityType: string}> = DEFAULT_ENTITY_TYPE_MAP): string => {
    if (!apiPath) return '';
    for (const entry of map) {
        if (apiPath.includes(entry.urlPrefix)) return entry.entityType;
    }
    return '';
};

/* Default entity-type → MUI icon mapping. Plugins can override via
   TreeViewMaster's `iconMap` prop. */
export const DEFAULT_ICON_MAP: Record<string, React.ComponentType<any>> = {
    process:   AccountTreeIcon,
    device:    MemoryIcon,
    host:      DnsIcon,
    workplace: BusinessIcon,
    workbench: WorkbenchIcon,
    operation: OperationIcon,
    audit:     AuditIcon,
    profile:   ProfileIcon,
    driver:    DriverIcon,
    plugin:    ExtensionIcon,
};

export const getIconForType = (
    apiPath: string | undefined,
    isNode: boolean,
    isExpanded: boolean,
    entityTypeMap: Array<{urlPrefix: string; entityType: string}> = DEFAULT_ENTITY_TYPE_MAP,
    iconMap: Record<string, React.ComponentType<any>> = DEFAULT_ICON_MAP
): React.ComponentType<any> => {
    if (isNode) {
        return isExpanded ? FolderOpenIcon : FolderIcon;
    }
    const type = getEntityType(apiPath, entityTypeMap);
    return iconMap[type] || FileIcon;
};
