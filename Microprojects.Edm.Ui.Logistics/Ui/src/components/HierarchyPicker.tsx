import type { TreeDataItem, UUID } from '@logistics/data/types'
import {
    DropDownTree,
    type DropDownTreeChangeEvent,
} from '@progress/kendo-react-dropdowns'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

export function findInHierarchy(
    nodes: TreeDataItem[] | undefined,
    id: UUID | undefined,
): TreeDataItem | null {
    if (!nodes || !id) return null
    for (const n of nodes) {
        if (n.id === id) return n
        const child = findInHierarchy(n.items, id)
        if (child) return child
    }
    return null
}

// Drop leaves not in `allowedIds` and folders that have no allowed descendants.
// Used to constrain a TareType picker to a Nomenclature's AllowedTareTypes
// while preserving the directory grouping.
export function pruneHierarchy(
    nodes: TreeDataItem[] | undefined,
    allowedIds: Set<UUID>,
): TreeDataItem[] {
    if (!nodes) return []
    const out: TreeDataItem[] = []
    for (const n of nodes) {
        if (n.isFolder) {
            const children = pruneHierarchy(n.items, allowedIds)
            if (children.length > 0) {
                out.push({ ...n, items: children })
            }
        } else if (allowedIds.has(n.id)) {
            out.push(n)
        }
    }
    return out
}

// Drop outdated leaves (auto-fork has produced a successor) and folders that
// become empty as a result. The currently selected `keepId` is preserved even
// when outdated so existing references on saved records still resolve to a
// readable label in the picker input.
export function dropOutdated(
    nodes: TreeDataItem[] | undefined,
    keepId: UUID | undefined,
): TreeDataItem[] {
    if (!nodes) return []
    const out: TreeDataItem[] = []
    for (const n of nodes) {
        if (n.isFolder) {
            const children = dropOutdated(n.items, keepId)
            if (children.length > 0) {
                out.push({ ...n, items: children })
            }
        } else if (!n.outdated || n.id === keepId) {
            out.push(n)
        }
    }
    return out
}

// Reusable canvas context for text measurement — created lazily on first use.
let _measureCtx: CanvasRenderingContext2D | null | undefined
function getMeasureCtx(): CanvasRenderingContext2D | null {
    if (_measureCtx === undefined) {
        try {
            _measureCtx = document.createElement('canvas').getContext('2d')
        } catch {
            _measureCtx = null
        }
    }
    return _measureCtx ?? null
}

type Measurements = {
    /** Widest leaf label by itself (without any tree indentation). Drives
     *  the picker INPUT min-width so the longest selectable name shows in
     *  full. */
    labelPx: number
    /** Widest visible row including per-level indentation. Drives the
     *  popup width so deep tree rows aren't cut off horizontally. */
    rowPx: number
}

function measureTree(
    nodes: TreeDataItem[] | undefined,
    font: string,
    indentPx: number,
): Measurements {
    if (!nodes || nodes.length === 0) return { labelPx: 0, rowPx: 0 }
    const ctx = getMeasureCtx()
    if (!ctx) return { labelPx: 0, rowPx: 0 }
    ctx.font = font
    let labelPx = 0
    let rowPx = 0
    const walk = (list: TreeDataItem[], depth: number) => {
        for (const n of list) {
            if (n?.name) {
                const w = ctx.measureText(n.name).width
                if (w > labelPx) labelPx = w
                const r = w + depth * indentPx
                if (r > rowPx) rowPx = r
            }
            if (n?.items?.length) {
                walk(n.items, depth + 1)
            }
        }
    }
    walk(nodes, 0)
    return { labelPx, rowPx }
}

export type HierarchyPickerProps = {
    data: TreeDataItem[] | undefined
    value: UUID | undefined
    onChange: (value: UUID | undefined) => void
    placeholder?: string
    style?: React.CSSProperties
    /** Locks the picker INPUT to a fixed width — use this for toolbar
     *  layouts (Repacking, Allocation, Order population) where space is
     *  constrained and a small, predictable input width is required.
     *  When omitted the input auto-sizes to fit the widest visible leaf
     *  label, so no Detail-editor selection is ever truncated. The dropdown
     *  POPUP sizes itself to the widest tree row in either case. */
    width?: number | string
}

export function HierarchyPicker({
    data,
    value,
    onChange,
    placeholder,
    style,
    width,
}: HierarchyPickerProps) {
    // Outdated (auto-forked) leaves never appear in the dropdown; the current
    // value is preserved so existing references still display their label.
    const visibleData = useMemo(
        () => dropOutdated(data, value),
        [data, value],
    )

    // Auto-size to the data on every reload. The wrapper is used to read
    // the actual rendered font (Kendo theme + browser size) so the canvas
    // measurement matches what the user sees.
    const wrapperRef = useRef<HTMLSpanElement>(null)
    const [labelPx, setLabelPx] = useState<number>()

    useEffect(() => {
        if (visibleData.length === 0) {
            setLabelPx(undefined)
            return
        }
        const computed = wrapperRef.current
            ? window.getComputedStyle(wrapperRef.current)
            : null
        const font =
            computed?.font ||
            `${computed?.fontSize ?? '14px'} ${computed?.fontFamily ?? 'sans-serif'}`
        const { labelPx } = measureTree(visibleData, font, 24)
        // Picker chrome: chevron, optional clear (X), inner padding ≈ 56px.
        if (labelPx > 0) setLabelPx(Math.ceil(labelPx + 56))
        else setLabelPx(undefined)
        // The popup width is NOT computed here. Kendo's internal
        // `useDropdownWidth` hook resets popupSettings.width to the picker
        // element's offsetWidth on mount, so passing a number to
        // popupSettings.width is silently ignored. Instead the popup gets
        // a custom class (below) and App.css lets the popup size itself
        // to the widest row via `width: max-content !important`.
    }, [visibleData])

    const mergedStyle = useMemo<React.CSSProperties>(() => {
        if (width != null) {
            // Toolbar mode — caller dictates the exact input width.
            return {
                ...style,
                width: typeof width === 'number' ? `${width}px` : width,
            }
        }
        // Detail-editor mode — let the input auto-size to the longest
        // visible leaf label (so no selection is ever truncated).
        return {
            ...style,
            ...(labelPx != null ? { minWidth: labelPx } : {}),
        }
    }, [style, width, labelPx])

    // Once Kendo opens the popup, set two inline styles on it:
    //   * min-width = picker width, so the popup never appears narrower than
    //     the input it dropped from (when the data tree is short on text);
    //   * max-height = distance from the popup's top to the viewport bottom,
    //     so a tall tree doesn't push the page into scrolling.
    // Kendo doesn't honour popupSettings.height on DropDownTree (declared
    // but never wired through), and we already had to override the width
    // via CSS — both happen here. requestAnimationFrame waits one frame so
    // Kendo's collision-aware positioning is finalised before we measure.
    const handleOpen = () => {
        requestAnimationFrame(() => {
            const popups = document.querySelectorAll<HTMLElement>(
                '.k-animation-container.hierarchy-popup-auto-width',
            )
            const popup = popups[popups.length - 1]
            if (!popup) return

            const picker = wrapperRef.current?.querySelector<HTMLElement>(
                '.k-dropdowntree',
            )
            if (picker) {
                popup.style.minWidth = `${picker.offsetWidth}px`
            }

            const rect = popup.getBoundingClientRect()
            const margin = 8
            const available = window.innerHeight - rect.top - margin
            // Floor at 120px so a popup near the bottom edge isn't reduced
            // to a sliver — Kendo's collision logic should have flipped it
            // upward before we got here, but this is a safety net.
            popup.style.maxHeight = `${Math.max(120, available)}px`
        })
    }

    return (
        <span ref={wrapperRef}>
            <DropDownTree
                data={visibleData}
                dataItemKey="id"
                textField="name"
                subItemsField="items"
                expandField="expanded"
                value={findInHierarchy(visibleData, value)}
                onChange={(e: DropDownTreeChangeEvent) => {
                    const sel = e.value as TreeDataItem | null
                    if (!sel) {
                        onChange(undefined)
                        return
                    }
                    if (sel.isFolder) return
                    onChange(sel.id as UUID)
                }}
                onOpen={handleOpen}
                item={(itemProps: any) => {
                    const node = itemProps.item as TreeDataItem
                    return node?.isFolder ? (
                        <strong>{node.name}</strong>
                    ) : (
                        <span>{node?.name}</span>
                    )
                }}
                placeholder={placeholder}
                style={mergedStyle}
                popupSettings={{ className: 'hierarchy-popup-auto-width' }}
            />
        </span>
    )
}
