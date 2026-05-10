import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
    Box,
    ClickAwayListener,
    InputAdornment,
    Paper,
    Popper,
    TextField,
} from '@mui/material';
import {
    KeyboardArrowDown as ChevronIcon,
    Close as ClearIcon,
} from '@mui/icons-material';
import {SimpleTreeView} from '@mui/x-tree-view/SimpleTreeView';
import {TreeItem} from '@mui/x-tree-view/TreeItem';

// HierarchyPicker — MUI port of Logistics's Kendo DropDownTree-based picker.
// Preserves the canvas-measured auto-sizing (input min-width to widest leaf;
// popup sized to widest tree row) and the policy-aware helpers
// (findInHierarchy / pruneHierarchy / dropOutdated).

/** Generic hierarchy-node shape consumed by the picker. Folders are
 *  non-selectable and rendered bold; leaves are clickable. `outdated`
 *  leaves are hidden unless they're the current selection. */
export interface HierarchyNode {
    id: string;
    name: string;
    isFolder?: boolean;
    items?: HierarchyNode[];
    outdated?: boolean;
}

export function findInHierarchy(
    nodes: HierarchyNode[] | undefined,
    id: string | undefined,
): HierarchyNode | null {
    if (!nodes || !id) return null;
    for (const n of nodes) {
        if (n.id === id) return n;
        const child = findInHierarchy(n.items, id);
        if (child) return child;
    }
    return null;
}

/** Drop leaves not in `allowedIds` and folders that have no allowed
 *  descendants. Useful for constraining a picker to a policy-derived
 *  subset while preserving the directory grouping. */
export function pruneHierarchy(
    nodes: HierarchyNode[] | undefined,
    allowedIds: Set<string>,
): HierarchyNode[] {
    if (!nodes) return [];
    const out: HierarchyNode[] = [];
    for (const n of nodes) {
        if (n.isFolder) {
            const children = pruneHierarchy(n.items, allowedIds);
            if (children.length > 0) {
                out.push({...n, items: children});
            }
        } else if (allowedIds.has(n.id)) {
            out.push(n);
        }
    }
    return out;
}

/** Drop outdated leaves (an auto-fork has produced a successor) and folders
 *  that become empty as a result. The currently selected `keepId` is
 *  preserved even when outdated so existing references on saved records
 *  still resolve to a readable label in the picker input. */
export function dropOutdated(
    nodes: HierarchyNode[] | undefined,
    keepId: string | undefined,
): HierarchyNode[] {
    if (!nodes) return [];
    const out: HierarchyNode[] = [];
    for (const n of nodes) {
        if (n.isFolder) {
            const children = dropOutdated(n.items, keepId);
            if (children.length > 0) {
                out.push({...n, items: children});
            }
        } else if (!n.outdated || n.id === keepId) {
            out.push(n);
        }
    }
    return out;
}

// Canvas text measurement for auto-sizing.
let _measureCtx: CanvasRenderingContext2D | null | undefined;
function getMeasureCtx(): CanvasRenderingContext2D | null {
    if (_measureCtx === undefined) {
        try {
            _measureCtx = document.createElement('canvas').getContext('2d');
        } catch {
            _measureCtx = null;
        }
    }
    return _measureCtx ?? null;
}

interface Measurements {
    /** Widest leaf label (no indentation). Drives input min-width. */
    labelPx: number;
    /** Widest tree row including indentation. Drives popup width. */
    rowPx: number;
}

function measureTree(
    nodes: HierarchyNode[] | undefined,
    font: string,
    indentPx: number,
): Measurements {
    if (!nodes || nodes.length === 0) return {labelPx: 0, rowPx: 0};
    const ctx = getMeasureCtx();
    if (!ctx) return {labelPx: 0, rowPx: 0};
    ctx.font = font;
    let labelPx = 0;
    let rowPx = 0;
    const walk = (list: HierarchyNode[], depth: number) => {
        for (const n of list) {
            if (n?.name) {
                const w = ctx.measureText(n.name).width;
                if (w > labelPx) labelPx = w;
                const r = w + depth * indentPx;
                if (r > rowPx) rowPx = r;
            }
            if (n?.items?.length) {
                walk(n.items, depth + 1);
            }
        }
    };
    walk(nodes, 0);
    return {labelPx, rowPx};
}

function collectFolderIds(nodes: HierarchyNode[] | undefined, into: string[] = []): string[] {
    if (!nodes) return into;
    for (const n of nodes) {
        if (n.isFolder) {
            into.push(n.id);
            collectFolderIds(n.items, into);
        }
    }
    return into;
}

function findPathToNode(
    nodes: HierarchyNode[] | undefined,
    targetId: string | undefined,
    acc: string[] = [],
): string[] | null {
    if (!nodes || !targetId) return null;
    for (const n of nodes) {
        if (n.id === targetId) return acc;
        if (n.items) {
            const next = findPathToNode(n.items, targetId, [...acc, n.id]);
            if (next) return next;
        }
    }
    return null;
}

export interface HierarchyPickerProps {
    data: HierarchyNode[] | undefined;
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    placeholder?: string;
    /** Fixed input width — use for toolbar layouts where space is constrained.
     *  When omitted the input auto-sizes to fit the widest visible leaf label. */
    width?: number | string;
    /** Render the input as size="small" (matches MUI dense form layouts). */
    size?: 'small' | 'medium';
    /** Disabled state. */
    disabled?: boolean;
    /** Allow clearing the selection. Default true. */
    clearable?: boolean;
    style?: React.CSSProperties;
}

export function HierarchyPicker({
    data,
    value,
    onChange,
    placeholder,
    width,
    size = 'small',
    disabled,
    clearable = true,
    style,
}: HierarchyPickerProps) {
    // Outdated leaves never appear in the dropdown; the current value is
    // preserved so existing references still display their label.
    const visibleData = useMemo(() => dropOutdated(data, value), [data, value]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [labelPx, setLabelPx] = useState<number>();
    const [popupMinWidth, setPopupMinWidth] = useState<number>();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    /* Auto-size input min-width based on widest visible leaf label, using the
       wrapper's actually-rendered font (theme + browser size aware). */
    useEffect(() => {
        if (visibleData.length === 0) {
            setLabelPx(undefined);
            return;
        }
        const computed = wrapperRef.current
            ? window.getComputedStyle(wrapperRef.current)
            : null;
        const font = computed?.font ||
            `${computed?.fontSize ?? '14px'} ${computed?.fontFamily ?? 'sans-serif'}`;
        const {labelPx: lbl} = measureTree(visibleData, font, 24);
        // Picker chrome: chevron + clear + adornment padding ≈ 56px
        if (lbl > 0) setLabelPx(Math.ceil(lbl + 56));
        else setLabelPx(undefined);
    }, [visibleData]);

    /* Open: expand path-to-selected so the active leaf is visible; pin popup
       min-width to the input so a short tree doesn't render narrower than
       the trigger. (Max-width / max-height are handled by Popper modifiers.) */
    const handleOpen = () => {
        if (disabled) return;
        const path = findPathToNode(visibleData, value);
        if (path) setExpandedItems((prev) => Array.from(new Set([...prev, ...path])));
        if (wrapperRef.current) setPopupMinWidth(wrapperRef.current.offsetWidth);
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined);
    };

    const handleSelect = (_e: React.SyntheticEvent | null, itemId: string | null) => {
        if (!itemId) return;
        const node = findInHierarchy(visibleData, itemId);
        if (!node || node.isFolder) return;
        onChange(node.id);
        setOpen(false);
    };

    const selectedNode = useMemo(() => findInHierarchy(visibleData, value), [visibleData, value]);
    const inputValue = selectedNode?.name ?? '';

    const inputStyle = useMemo<React.CSSProperties>(() => {
        if (width != null) {
            return {...style, width: typeof width === 'number' ? `${width}px` : width};
        }
        return {...style, ...(labelPx != null ? {minWidth: labelPx} : {})};
    }, [style, width, labelPx]);

    const renderTreeItems = (nodes: HierarchyNode[]): React.ReactNode =>
        nodes.map((n) => (
            <TreeItem
                key={n.id}
                itemId={n.id}
                label={n.isFolder ? <strong>{n.name}</strong> : <span>{n.name}</span>}
                disabled={n.isFolder}
            >
                {n.items && n.items.length > 0 ? renderTreeItems(n.items) : null}
            </TreeItem>
        ));

    return (
        <>
            <Box ref={wrapperRef} sx={{display: 'inline-block'}} style={inputStyle}>
                <TextField
                    fullWidth
                    size={size}
                    disabled={disabled}
                    placeholder={placeholder}
                    value={inputValue}
                    onClick={handleOpen}
                    InputProps={{
                        readOnly: true,
                        sx: {cursor: disabled ? 'default' : 'pointer'},
                        endAdornment: (
                            <InputAdornment position="end">
                                {clearable && value && !disabled && (
                                    <ClearIcon
                                        fontSize="small"
                                        onClick={handleClear}
                                        sx={{cursor: 'pointer', color: 'text.secondary', mr: 0.5}}
                                    />
                                )}
                                <ChevronIcon fontSize="small" sx={{color: 'text.secondary'}} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
            <Popper
                open={open}
                anchorEl={wrapperRef.current}
                placement="bottom-start"
                style={{zIndex: 1500}}
                modifiers={[
                    {name: 'offset', options: {offset: [0, 4]}},
                    {name: 'preventOverflow', options: {boundary: 'viewport', padding: 8}},
                    {name: 'flip', options: {fallbackPlacements: ['top-start']}},
                ]}
            >
                <ClickAwayListener onClickAway={handleClose}>
                    <Paper
                        elevation={3}
                        sx={{
                            minWidth: popupMinWidth,
                            maxHeight: 'min(60vh, 480px)',
                            overflow: 'auto',
                            py: 0.5,
                        }}
                    >
                        <SimpleTreeView
                            expandedItems={expandedItems}
                            onExpandedItemsChange={(_e, ids) => setExpandedItems(ids)}
                            selectedItems={value ?? null}
                            onSelectedItemsChange={handleSelect}
                        >
                            {renderTreeItems(visibleData)}
                        </SimpleTreeView>
                    </Paper>
                </ClickAwayListener>
            </Popper>
        </>
    );
}
